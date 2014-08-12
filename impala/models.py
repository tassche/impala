from impala.utils import seconds_to_str
from threading import Thread
from time import sleep
import mpd
import logging

logger = logging.getLogger(__name__)


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
        self._host, self._port = host, port
        self._password = password

    def _init_results(self):
        self.currentsong = None
        self.pretty_currentsong_time = None
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
            self._client = MPDClient()
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
        self.pretty_currentsong_time = self._client.pretty_currentsong_time()
        self.status = self._client.status()

    def stop(self):
        self._polling = False

