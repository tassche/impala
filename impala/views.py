from flask import flash, jsonify, redirect, render_template, request, url_for
from flask import g, session, Response
from functools import wraps
from impala.models import MPDClient
from impala import app, poller
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
            g.client.connect(app.config['MPD_HOST'], app.config['MPD_PORT'])
            if app.config['MPD_PASSWORD']:
                g.client.password(app.config['MPD_PASSWORD'])
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
        except BadGateway as e:
            logger.error(e.description)
            return 'Error: %s' % e.description
    return wrapper

@app.route('/')
@redirect_on_error
@mpdclient
def main():
    return render_template('currentsong.html')

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

@app.route('/poller/<command>')
def mpd_poller(command):
    if command not in ('currentsong', 'pretty_currentsong_time', 'status'):
        raise BadRequest(description='Command not supported.')
    try:
        return jsonify(getattr(poller, command))
    except TypeError as e:
        raise BadGateway(description='Invalid MPD response.')

