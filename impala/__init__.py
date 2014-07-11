from flask import Flask

app = Flask(__name__, instance_relative_config=True)
app.config.from_object('config')
app.config.from_pyfile('config.py')

from impala import views

import logging

def set_up_logging():
    fmt = '{levelname:5} [{asctime}] {module}: {funcName}: {message}'
    formatter = logging.Formatter(fmt, style='{')
    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    for logger in logging.getLogger('impala'), logging.getLogger('mpd'):
        logger.addHandler(stream)
        logger.setLevel(logging.DEBUG)
