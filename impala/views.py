from flask import flash, jsonify, redirect, render_template, request, url_for
from flask import g, session
from functools import wraps
from impala.models import MPDClient
from impala import app
from werkzeug.exceptions import BadGateway, BadRequest, Unauthorized
import json
import logging
import mpd

logger = logging.getLogger('impala')

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

@app.route('/connect', methods=['GET', 'POST'])
def connect():
    if request.method == 'GET':
        if {'server', 'port', 'password'}.issubset(session.keys()) \
            and bool(session['server']):
            return redirect(url_for('main'))
        else:
            return render_template('connect.html')
    else:
        try:
            g.client = MPDClient()
            g.client.connect(request.form['server'], 6600)
            if request.form['password']:
                g.client.password(request.form['password'])
            g.client.close()
            g.client.disconnect()
            session['server'] = request.form['server']
            session['port'] = 6600
            session['password'] = request.form['password']
        except (mpd.ConnectionError, OSError) as e:
            logger.error(e)
            flash(str(e))
            return render_template('connect.html')
        except mpd.CommandError as e:
            logger.error(e)
            flash(str(e))
            g.client.close()
            g.client.disconnect()
            return render_template('connect.html')
        return redirect(url_for('main'))

@app.route('/disconnect')
def disconnect():
    session.clear()
    return redirect(url_for('connect'))

@app.route('/')
@redirect_on_error
@mpdclient
def main():
    data = {
        'status': g.client.status(),
        'currentsong': g.client.currentsong(),
        'songtime': g.client.currentsong_time_str(),
    }
    return render_template('currentsong.html', **data)

@app.route('/status')
@mpdclient
def status():
    return render_template('mpd.html')

@app.route('/play')
@mpdclient
def play():
    g.client.play()
    return 'OK'

@app.route('/pause')
@mpdclient
def pause():
    g.client.pause()
    return 'OK'

@app.route('/currentsong/time')
@mpdclient
def currentsong_time():
    e, t = g.client.currentsong_time_str()
    return jsonify(elapsed=e, total=t)

_mpd_commands = (
    # Playback
    'play', 'pause', 'stop', 'previous', 'next',
    # Status
    'currentsong', 'stats', 'status',
)

@app.route('/mpd/<command>')
@mpdclient
def mpd_command(command):
    if command not in _mpd_commands:
        raise BadRequest(description='No such command.')
    result = getattr(g.client, command)()
    return jsonify(result) if result is not None else 'OK'
