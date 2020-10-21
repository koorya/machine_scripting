import cv2
import base64
import numpy as np


# encode ndarray to base64
def ndarray2base64(img):
	_, im_arr1 = cv2.imencode('.png', img)  # im_arr: image in Numpy one-dim array format.
	im_bytes = im_arr1.tobytes()
	im_b64 = base64.b64encode(im_bytes)
	im_b64_utf8 = im_b64.decode("utf-8")
	return im_b64_utf8

# decode from base64 to ndarray
def base642ndarray(str):
	im_b64 = str.encode("utf-8")
	im_bytes = base64.b64decode(im_b64)
	im_arr = np.frombuffer(im_bytes, dtype=np.uint8)  # im_arr is one-dim Numpy array
	img = cv2.imdecode(im_arr, flags=cv2.IMREAD_COLOR)
	return img