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

from flask import g, jsonify, render_template, request, Response
from functools import wraps
from impala import app, poller
from werkzeug.exceptions import BadGateway, BadRequest
import json
import logging
import mpd


logger = logging.getLogger(__name__)


def mpdclient(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            g.client = mpd.MPDClient()
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
    context = {
        'active_quicknav_element': '#quicknav-currentsong',
    }
    return render_template('currentsong.html', **context)


@app.route('/about')
def about():
    context = {
        'active_navbar_element': '#nav-about',
    }
    return render_template('about.html', **context)


@app.route('/playlist')
@redirect_on_error
@mpdclient
def playlist():
    context = {
        'active_navbar_element': '#nav-playlist',
        'active_quicknav_element': '#quicknav-playlist',
    }
    return render_template('playlist.html', **context)


@app.route('/library')
@redirect_on_error
@mpdclient
def library():
    context = {
        'active_navbar_element': '#nav-library',
        'active_quicknav_element': '#quicknav-library',
    }
    return render_template('library.html', **context)


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
    try:
        return jsonify(result) if result is not None else 'OK'
    except ValueError:
        # result is plain text (eg. addid command)
        return result


@app.route('/poller/<command>')
def mpd_poller(command):
    if command not in ('currentsong', 'status'):
        raise BadRequest(description='Command not supported.')
    try:
        return jsonify(getattr(poller, command))
    except TypeError as e:
        raise BadGateway(description='Invalid MPD response.')

