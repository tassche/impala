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

from threading import Thread
from time import sleep
import mpd
import logging

logger = logging.getLogger(__name__)


class MPDPoller(Thread):
    def __init__(self, host, port=6600, password=''):
        super(MPDPoller, self).__init__()
        self._host, self._port = host, port
        self._password = password

    def _init_results(self):
        self.currentsong = None
        self.status = None

    def run(self):
        self._init_results()
        self._polling = True
        self._connect()
        while(self._polling):
            logger.debug('polling %s' % self._host)
            try:
                self._poll()
            except (OSError, mpd.MPDError) as e:
                logger.error('polling failed: %s' % e)
                self._init_results()
                if not self._close():
                    sleep(15)
                if not self._connect():
                    sleep(15)
            sleep(0.2)
        self._close()

    def _connect(self):
        try:
            self._client = mpd.MPDClient()
            self._client.connect(self._host, self._port)
            if self._password:
                try:
                    self._client.password(self._password)
                except mpd.CommandError as e:
                    logger.error('command error: %s' % e)
                    return False
        except (OSError, mpd.MPDError) as e:
            logger.debug('connecting failed: %s' % e)
            return False
        return True

    def _close(self):
        try:
            self._client.close()
            self._client.disconnect()
        except (OSError, mpd.MPDError) as e:
            logger.debug('disconnecting failed: %s' % e)
            return False
        return True

    def _poll(self):
        self._client.ping()
        self.currentsong = self._client.currentsong()
        self.status = self._client.status()

    def stop(self):
        self._polling = False

