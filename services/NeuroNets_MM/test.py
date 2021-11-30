import os
from dotenv import load_dotenv
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

MY_VAR = os.environ.get('MY_VAR')
account = os.environ['NNservice'].split(':')
ip='172.16.201.142'

if (MY_VAR != None):
	print(f'{MY_VAR}')
else:
	print(f'MY_VAR')

print(f"rtsp://{account[0]}:{account[1]}@{ip}:554/Streaming/Channels/101")