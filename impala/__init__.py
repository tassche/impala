###
# Impala
# Copyright (C) 2014 Tijl Van Assche <tijlvanassche@gmail.com>
#
# This file is part of Impala.
#
# Impala is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Impala is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Impala.  If not, see <http://www.gnu.org/licenses/>.
###

from flask import Flask
from impala.models import MPDPoller
import logging

app = Flask(__name__, instance_relative_config=True)
app.config.from_object('config')
app.config.from_pyfile('config.py', silent=True)

def set_up_logging():
    fmt = '{levelname:5} [{asctime}] [{thread}] {name} : {message}'
    formatter = logging.Formatter(fmt, style='{')
    stream = logging.StreamHandler()
    stream.setFormatter(formatter)
    level = logging.DEBUG if app.config['DEBUG'] else logging.INFO
    logger = logging.getLogger(__name__)
    logger.addHandler(stream)
    logger.setLevel(level)
    if app.config['DEBUG_MPD']:
        logger = logging.getLogger('mpd')
        logger.addHandler(stream)
        logger.setLevel(logging.DEBUG)

set_up_logging()

poller = MPDPoller(app.config['MPD_HOST'], app.config['MPD_PORT'],
                   password=app.config['MPD_PASSWORD'])
poller.daemon = True
poller.start()

from impala import views
