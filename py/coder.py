import json
import numpy as np
from . import utils



# идея взята отсюда, 
# https://code.tutsplus.com/ru/tutorials/serialization-and-deserialization-of-python-objects-part-1--cms-26183

class CustomEncoder(json.JSONEncoder) :
	def default(self, o):
		if isinstance(o, np.ndarray): # картинки opencv в формате np.ndarray
			if o.dtype != np.uint8 :
				print("image dtype must be uint8")
			return {'__base64img__': utils.ndarray2base64(o)}
		return {o.__class__.__name__: o.__dict__}

		
