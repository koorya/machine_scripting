


class CNNTask(object):
	"""
	задания будут десериализоваться в объект такого класса
	"""
	def __init__(self):
		self.a = 0
		self.b = 0
		self.image = None
	pass

class CNNAnswer(object):
	"""
	ответы отправляются в таком формате
	"""
	def __init__(self):
		self.res = 0
		self.image = None
	pass


class ServiceTask(object):
	def __init__(self, command):
		self.command = command
		pass
	pass

