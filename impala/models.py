from flask import redirect, session, url_for
from functools import wraps
from mpd import MPDClient, MPDError

import logging
logger = logging.getLogger('impala')

client = MPDClient()

def require_mpd(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            client.ping()
        except (MPDError, OSError) as e:
            logger.error(e)
            return redirect(url_for('connect'))
        return func(*args, **kwargs)
    return wrapper
