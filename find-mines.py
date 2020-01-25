import frida, sys
import time

def on_message(message, data):
    if message['type'] == 'send':
        print("[*] {0}".format(message['payload']))
    else:
        print(message)

with open('./gnome-mines.js', 'r') as f: jscode = f.read()

process = frida.attach('gnome-mines')
script = process.create_script(jscode)
script.on('message', on_message)
print('[*] Reveal mines')
script.load()

while True:
    time.sleep(10)