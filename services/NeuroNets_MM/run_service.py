# -*- coding: utf-8 -*-

'''
Запустить СЕГМЕНТИРУЮЩУЮ сеть можно перейдя по этой ссылки: http://localhost:8090/segment?ipcl=172.16.201.137&ipcr=172.16.201.142
Запустить КЛАССИФИЦИРУЮЩУЮ сеть можно перейдя по этой ссылки: http://localhost:8090/class?ipcl=172.16.201.137&ipcr=172.16.201.142
'''

# .....................................................................................................................

import os
import sys
import getopt
from flask import Flask, jsonify, request
import cv2 as cv
import numpy as np
from datetime import datetime
from dotenv import load_dotenv


import tensorflow as tf
from tensorflow.keras.models import load_model

# .....................................................................................................................

img_clip = lambda a: np.clip(a/255.0, 0.0, 1.0)    
img_224x224 = lambda a: cv.resize(a, (224, 224), interpolation = cv.INTER_AREA)
img_224x224_clip = lambda a: np.clip(cv.resize(a, (224, 224), interpolation = cv.INTER_AREA)/255.0, 0.0, 1.0)

human_datetime = lambda a: a.strftime('%d.%m.%Y %H:%M:%S.%f')[:-3]
files_datetime = lambda a: a.strftime('%d%m%Y__%H%M%S%f')[:-3]

# .....................................................................................................................

service_debug = False
service_port = 8090

class_nn_model = './models/nnet_c.h5'
class_nn_model_weigths = './models/nnet_c_W.h5'


segm_nn_model = './models/nnet_s.h5'
segm_nn_model_weigths = './models/nnet_s_W.h5'

classes = ['NG', 'OK']

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

DEFAULT_CAM_ADDRESS = os.environ.get('DEFAULT_CAM_ADDRESS')
IMAGES_PATH = os.environ.get('IMAGES_PATH')

if not os.path.exists(IMAGES_PATH):
    os.makedirs(IMAGES_PATH)

# create the Flask app
app = Flask(__name__)

try:
    print('1. Load core for classifiacation neural network model.')
    C_model = load_model(class_nn_model, compile=True)        
    C_model.load_weights(class_nn_model_weigths)
except:
    print('!!! Failed load core for classifiacation neural network model.')
    sys.exit(2)

try:
    print('2. Load core for segmentation neural network model.')
    S_model = load_model(segm_nn_model, compile=True)        
    S_model.load_weights(segm_nn_model_weigths)
except:
    print('!!! Failed load core for segmentation neural network model.')
    sys.exit(2)

# .....................................................................................................................
# Формирует набор данных для проведения результирующего тестирования параметров сети
def generate_batch_for_predict_images(images_files, image_shape=(512, 512, 3)):
    '''
    Формирует набор данных для проведения результирующего тестирования параметров сети:
    Параметры:
    image_file - имя файла с изображением, который необходимо преобразовать в входной формат нейросети;
    image_shape - необходимый размер в пикселях (ширина/высота/глубина) элементов (изображений) выходного тензора;
    '''
    batch_out = []
    for imgfile in images_files:
        raw = cv.cvtColor(cv.imread(f"{IMAGES_PATH}/{imgfile}"), cv.COLOR_BGR2RGB) / 255.0
        
        if ((raw.shape[0]>image_shape[0]) and (raw.shape[1]>image_shape[1])):
            sx = raw.shape[0]
            sy = raw.shape[1]
            x_l = int((sx - image_shape[1]) / 2)
            x_u = int(x_l + image_shape[1])
            y_l = int((sy - image_shape[0]) / 2)
            y_u = int(y_l + image_shape[0])
            predict_out = raw[x_l:x_u, y_l:y_u]
        elif ((raw.shape[0]==image_shape[0]) and (raw.shape[1]==image_shape[1])):
            predict_out = raw
        else:
            predict_out = cv.resize(raw, (image_shape[1], image_shape[0]), interpolation = cv.INTER_AREA)
        batch_out.append(predict_out)
    
    return np.array(batch_out).reshape((-1, image_shape[0], image_shape[1], image_shape[2]))

# .....................................................................................................................
# Выполняет захват фотоизображения с IP-камеры
def capture_image_from_ipcamera(ip, crop, label):
    '''
    Функция захвата фотоизображения с IP-камеры
    Параметры:
    ip - сетевой адрес (строка) IP-камеры
    crop - числовая метка режим формирования области интереса (вырезения нужной части) на фотоизображении
    label - тестовая метка для имени файла, в которое будет сохранено захваченное фотоизображение.
    '''

    img = None
    out_name = None
    port = 554
    account = os.environ['NNservice'].split(':')
    try:
        if(DEFAULT_CAM_ADDRESS == None):
            cap = cv.VideoCapture(f"rtsp://{account[0]}:{account[1]}@{ip}:554/Streaming/Channels/101")
        else:
            cap = cv.VideoCapture(DEFAULT_CAM_ADDRESS)
    except Exception as err:
        print(f'Failed Capture: {ip}\n{err}')      
        # sys.exit(2)
    end_time_1 = datetime.now()

    _, img = cap.read()
    cv.imwrite(f'{IMAGES_PATH}/{label}_{ip}.jpg', img)
    cap.release()
    h, w, ch = img.shape

    if crop==1:
        sublabel = 'R'
        top = 0
        left = w - h
        right = w
        bottom = h
    elif crop==-1:
        sublabel = 'L'
        left = top = 0
        right = bottom = h
    else:
        sublabel = 'N'
        top = left = 0
        bottom = h
        right = w

    img = img[top:bottom, left:right, :]
    out_name = f'{label}_{sublabel}-CROP_{ip}.jpg'
    cv.imwrite(f"{IMAGES_PATH}/{out_name}", img)

    return out_name


# .....................................................................................................................
# Определяет область дефектов заклепочного соединения (сегментированные области красного цвета)
def predict_RED_on_segmentation_image(input_image, min_range = ([0, 100, 20], [160,100,20]), max_range = ([10, 255, 255],[179,255,255])):
    '''
    Функция, определяющая долевое значение сегментированной области красного цвета
    (область дефектов при заклепочном соединение) для указанного входного изображения.
    Параметры:
    input_image - входное изображение (ndarray-массив)
    min_range - кортеж минимальных значений для красного цвета на цветовой палитре HSV
    max_range - кортеж максимальных значений для красного цвета на цветовой палитре HSV
    '''

    result = input_image.copy()
    hsv = cv.cvtColor(input_image, cv.COLOR_BGR2HSV)

    lower1 = np.array(min_range[0])
    upper1 = np.array(max_range[0])
    lower2 = np.array(max_range[1])
    upper2 = np.array(max_range[1])
    
    lower_mask = cv.inRange(hsv, lower1, upper1)
    upper_mask = cv.inRange(hsv, lower2, upper2)
    
    full_mask = lower_mask + upper_mask
    red_result = cv.bitwise_and(result, result, mask=full_mask)
 
    area_red_in_px = int(np.sum(img_clip(full_mask)))
    area_red_at_mask = round( area_red_in_px * 100/(result.shape[0]**2),2) 
    out = f'Area RED {area_red_at_mask} % of image [{ area_red_in_px} px]'
    stacked = np.hstack((input_image, red_result))
    
    return stacked, area_red_at_mask, out
    
# .....................................................................................................................
#
@app.route('/', methods=['GET', 'POST'])
@app.route('/index', methods=['GET', 'POST'])
def main_dummy_func():
    '''
    Обработка стандартного обращения к основному адресу сервиса
    '''
    request_start = datetime.now()
    UserAgent = request.headers.get('User-Agent')
    response_generate = datetime.now()
    
    result = {
              'page': 'main page',
              'start_time': human_datetime(request_start),
              'end_time': human_datetime(response_generate),
              'agent':  UserAgent
             }

    return jsonify(result) 


saved_response_class = None
# .....................................................................................................................
# Запуск в работу КЛАССИФИЦИРУЮЩЕЙ сети
@app.route('/class', methods=['GET', 'POST'])
def classificate_func():    
    '''
    Обработка запроса к классифицирующей нейронной сети:
    Анализ фотоизображений заклёпочных соединений с указанных адресов для IP-камер
    '''
    global classes
    global saved_response_class

    last_req = request.args.get('last_req')

    if(last_req != None and saved_response_class != None):
        return jsonify(saved_response_class)

    request_start = datetime.now()
    IPcam_L = request.args.get('ipcl', default = '172.16.201.137', type = str)
    IPcam_R = request.args.get('ipcr', default = '172.16.201.142', type = str)

    image_IPcam_L = capture_image_from_ipcamera(IPcam_L, 1, files_datetime(request_start))
    image_IPcam_R = capture_image_from_ipcamera(IPcam_R, -1, files_datetime(request_start))

    ###
    predict_begin = datetime.now()    
    batch = generate_batch_for_predict_images([image_IPcam_L, image_IPcam_R], (224,224,3))
    class_predict = C_model.predict(batch, batch_size=len(batch), steps=len(batch), verbose=1)
    predict_in_str = [str(i[0]) for i in class_predict]
    predict_end = datetime.now()
    time_delta = predict_end - predict_begin
    time_predict = f'{time_delta.seconds}s {time_delta.microseconds//1000}ms'
    ###

    response_generate = datetime.now()
    
    time_delta = response_generate - request_start
    time_total = f'{time_delta.seconds//60}m {time_delta.seconds}s {time_delta.microseconds//1000}ms'

    result = {
              'RESULT': {'predict': predict_in_str, 'labels': [classes[1] if a > 0.75  else classes[0] for a in class_predict]},
              'TIMING': {'request': human_datetime(request_start), 'predict': time_predict, 'response': human_datetime(response_generate), 'total': time_total},
              'PATH': {'image_L': f"{IMAGES_PATH}/{image_IPcam_L}", 'image_R': f"{IMAGES_PATH}/{image_IPcam_R}"},
             }
    saved_response_class = result
    return jsonify(result)


saved_response_segment = None
# .....................................................................................................................
# Запуск в работу СЕГМЕНТИРУЮЩЕЙ сети
@app.route('/segment', methods=['GET', 'POST'])
def segmentation_func():

    # Запустить СЕГМЕНТИРУЮЩУЮ сеть можно перейдя по этой ссылки: http://localhost:8090/segment?ipcl=172.16.201.137&ipcr=172.16.201.142

    global saved_response_segment

    last_req = request.args.get('last_req')

    if(last_req != None and saved_response_segment != None):
        return jsonify(saved_response_segment)

    request_start = datetime.now()
    IPcam_L = request.args.get('ipcl', default = '172.16.201.137', type = str)
    IPcam_R = request.args.get('ipcr', default = '172.16.201.142', type = str)

    image_IPcam_L = capture_image_from_ipcamera(IPcam_L, 1, files_datetime(request_start)) 
    # image_IPcam_L = './test1.jpg'
    image_IPcam_R = capture_image_from_ipcamera(IPcam_R, -1, files_datetime(request_start)) 
    # image_IPcam_R = './test2.jpg'

    ###
    predict_begin = datetime.now()    
    batch = generate_batch_for_predict_images([image_IPcam_L, image_IPcam_R], (512,512,3))
    segment_predict = S_model.predict(batch, batch_size=len(batch), steps=len(batch), verbose=1)

    L_result_image = cv.cvtColor((segment_predict[0] * 255).astype('uint8'), cv.COLOR_RGB2BGR)
    R_result_image = cv.cvtColor((segment_predict[1] * 255).astype('uint8'), cv.COLOR_RGB2BGR)   

    predict_end = datetime.now()
    time_delta = predict_end - predict_begin
    time_predict = f'{time_delta.seconds}s {time_delta.microseconds//1000}ms'
    ###

    _L_stack_images, _L_red_area, _L_text = predict_RED_on_segmentation_image(L_result_image)
    _R_stack_images, _R_red_area, _R_text = predict_RED_on_segmentation_image(R_result_image)

    cv.imwrite(f'{IMAGES_PATH}/Predict_{image_IPcam_L}', _L_stack_images)
    cv.imwrite(f'{IMAGES_PATH}/Predict_{image_IPcam_R}', _R_stack_images)

    response_generate = datetime.now()
    
    time_delta = response_generate - request_start
    time_total = f'{time_delta.seconds//60}m {time_delta.seconds}s {time_delta.microseconds//1000}ms'

    result = { 'RESULT': {'predict_image_L': f'{IMAGES_PATH}/Predict__{image_IPcam_L}', 'predict_image_R': f'{IMAGES_PATH}/Predict__{image_IPcam_R}',
                          'predict_L': "NG" if _L_red_area>=4.5 else "OK", 'predict_R': "NG" if _R_red_area>=4.5 else "OK",
                          'text_L': _L_text, 'text_R': _R_text
                         },
              'TIMING': {'request': human_datetime(request_start), 'predict': time_predict, 'response': human_datetime(response_generate), 'total': time_total},
              'PATH': {'image_L': f"{IMAGES_PATH}/{image_IPcam_L}", 'image_R': f"{IMAGES_PATH}/{image_IPcam_R}"}
             }

    saved_response_segment = result
    return jsonify(result)

# .....................................................................................................................

@app.errorhandler(404)
def errorhandler_404(e):
    return jsonify(error=str(e)), '404 Not Found'

@app.errorhandler(403)
def errorhandler_403(e):
    return jsonify(error=str(e)), '403 Forbidden'

@app.errorhandler(500)
def errorhandler_500(e):
    return jsonify(error=str(e)), '500 Internal Server Error'

# .....................................................................................................................

def main():
    global service_debug, service_port
   
    try:
        opts, args = getopt.gnu_getopt(sys.argv[1:], '', ['service_port=', 'debug'])
        for opt, val in opts:
            if opt in ('--service_port'):
                service_port = int(val.lower())
            elif opt in ('--debug'):
                service_debug = True
    except getopt.GetoptError as err:
        print(err)
        sys.exit(2)   

    print('3. Load core for API service.')
    app.run(debug=service_debug, port=service_port)
    
# .....................................................................................................................
# .....................................................................................................................

if __name__ == '__main__':

    main()
    
