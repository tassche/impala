from flask import g, redirect, session, url_for
from functools import wraps
from impala.utils import seconds_to_str
from werkzeug.exceptions import BadGateway, Unauthorized
import mpd

import logging
logger = logging.getLogger('impala')


class MPDClient(mpd.MPDClient):
    def currentsong_time_str(self):
        '''The elapsed and total time of the current playing song.

        A tuple with the elapsed time and the total time of the current 
        playing song, nicely formatted.
        '''
        try:
            e, t = self.status()['time'].split(':')
        except KeyError:
            e, t = 0, self.currentsong()['time']
        return seconds_to_str(int(e)), seconds_to_str(int(t))


def mpdclient(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            g.client = MPDClient()
            g.client.connect(session['server'], session['port'])
            if session['password']:
                g.client.password(session['password'])
            response = func(*args, **kwargs)
            g.client.close()
            g.client.disconnect()
        except KeyError:
            logger.error('invalid session: not connected')
            raise Unauthorized(description='Not connected to MPD.')
        except (mpd.ConnectionError, OSError) as e:
            logger.error(e)
            raise BadGateway(description=str(e))
        except mpd.CommandError as e:
            logger.error(e)
            g.client.close()
            g.client.disconnect()
            raise BadGateway(description=str(e))
        return response
    return wrapper

def redirect_on_error(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (BadGateway, Unauthorized) as e:
            logger.error(e)
            return redirect(url_for('disconnect'))
    return wrapper
