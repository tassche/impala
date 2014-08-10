from impala.utils import seconds_to_str
from threading import Thread
from time import sleep
import mpd
import logging
import sys

logger = logging.getLogger('impala')


class MPDClient(mpd.MPDClient):
    def pretty_currentsong_time(self):
        '''The elapsed and total time of the current playing song.

        A dict with the elapsed time and the total time of the current
        playing song, nicely formatted.
        '''
        try:
            e, t = self.status()['time'].split(':')
        except KeyError:
            return dict()
        return {'elapsed': seconds_to_str(int(e)),
                'total': seconds_to_str(int(t))}


class MPDPoller(Thread):
    def __init__(self, host, port=6600, password=''):
        super(MPDPoller, self).__init__()
        self._client = MPDClient()
        self._host, self._port = host, port
        self._password = password
        self.currentsong = None
        self.pretty_currentsong_time = None
        self.status = None

    def run(self):
        logger.info('poller started')
        self._polling = True
        self._client.connect(self._host, self._port)
        if self._password:
            self._client.password(self._password)
        while(self._polling):
            self._poll()
            sleep(0.2)
        self._client.close()
        self._client.disconnect()
        logger.info('poller stopped')

    def _poll(self):
        self._client.ping()
        self.currentsong = self._client.currentsong()
        self.pretty_currentsong_time = self._client.pretty_currentsong_time()
        self.status = self._client.status()

    def stop(self):
        self._polling = False

