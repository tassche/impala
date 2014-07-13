from flask import redirect, session, url_for
from functools import wraps
from impala.utils import seconds_to_str
import mpd

import logging
logger = logging.getLogger('impala')


class MPDClient(mpd.MPDClient):
    def currentsong_time(self):
        '''The elapsed and total time of the current song.'''
        e, t = self.status()['time'].split(':')
        return seconds_to_str(int(e)), seconds_to_str(int(t))


client = MPDClient()

def require_mpd(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            client.ping()
        except (mpd.MPDError, OSError) as e:
            logger.error(e)
            return redirect(url_for('connect'))
        return func(*args, **kwargs)
    return wrapper
