from . import utils
from .messagetypes import *

def decode_object(o):
	if 'CNNTask' in o:
		a = CNNTask()
		a.__dict__.update(o['CNNTask']) # обновляем поля в соответсвии со словарем из json
		return a
	elif 'CNNAnswer' in o:
		a = CNNAnswer()
		a.__dict__.update(o['CNNAnswer'])
		return a
	elif 'ServiceTask' in o:
		a = ServiceTask("")
		a.__dict__.update(o['ServiceTask'])
		return a
	elif '__base64img__' in o:
		a = utils.base642ndarray(o['__base64img__'])
		return a
	return o
