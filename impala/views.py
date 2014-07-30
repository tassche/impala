from flask import flash, jsonify, redirect, render_template, request, url_for
from flask import g, session, Response
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
            try:
                g.client.connect(session['server'], session['port'])
                if session['password']:
                    g.client.password(session['password'])
            except KeyError:
                logger.error('invalid session: not connected')
                raise Unauthorized(description='Not connected to MPD.')
            response = func(*args, **kwargs)
            g.client.close()
            g.client.disconnect()
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
    }
    return render_template('currentsong.html', **data)

@app.route('/status')
@mpdclient
def status():
    return render_template('mpd.html')

_not_commands = (
    'close', 'connect', 'disconnect', 'password', 'noidle',
    'command_list_ok_begin', 'command_list_end', 'fileno',
    'add_command', 'remove_command',
) # these commands are not supported by the /mpd/<command> route

def _build_args(request):
    args = list()
    for k, v in request.args.items():
        args.append(k)
        if v:
            args.append(v)
    return args

@app.route('/mpd/<command>')
@mpdclient
def mpd_command(command):
    if command in _not_commands or command.startswith('_'):
        raise BadRequest(description='Command not supported.')
    try:
        result = getattr(g.client, command)(*_build_args(request))
    except AttributeError:
        raise BadRequest(description='No such command.')
    if isinstance(result, list):
        # jsonify only supports top level objects
        # http://flask.pocoo.org/docs/api/#flask.json.jsonify
        return Response(json.dumps(result, sort_keys=True, indent=2),
                        mimetype='application/json')
    return jsonify(result) if result is not None else 'OK'
