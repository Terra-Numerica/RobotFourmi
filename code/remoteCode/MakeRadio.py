# Python code pour envoyer des messages radio suivant l'encodage des cartes microbit V2

class MakeRadio:
    def __init__(self, group_id):
        radio.config(group=group_id)
        radio.on()
        self.dal_header = b'\x01' + group_id.to_bytes(1) + b'\x01'
 
    def send_number(self, msg):
        packet_type = int('0').to_bytes(1)
        time_stamp = running_time().to_bytes(4)
        serial_num = int('0').to_bytes(4)
        msg_bytes = msg.to_bytes(4)
        raw_bytes = (self.dal_header +
                     packet_type +
                     time_stamp +
                     serial_num +
                     msg_bytes)
        radio.send_bytes(raw_bytes)
 
    def send_value(self, name, value):
        packet_type = int('1').to_bytes(1)
        time_stamp = running_time().to_bytes(4)
        serial_num = int('0').to_bytes(4)
        number = int(value).to_bytes(4)
        name_bytes = bytes(str(name), 'utf8')
        name_length = len(name_bytes).to_bytes(1)
        raw_bytes = (self.dal_header +
                     packet_type +
                     time_stamp +
                     serial_num +
                     number +
                     name_length +
                     name_bytes)
        radio.send_bytes(raw_bytes)
 
    def send_string(self, msg):
        packet_type = int('2').to_bytes(1)
        time_stamp = running_time().to_bytes(4)
        serial_num = int('0').to_bytes(4)
        msg_bytes = bytes(str(msg), 'utf8')
        msg_length = len(msg_bytes).to_bytes(1)
        raw_bytes = (self.dal_header +
                     packet_type +
                     time_stamp +
                     serial_num +
                     msg_length +
                     msg_bytes)
        radio.send_bytes(raw_bytes)