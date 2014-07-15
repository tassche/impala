from flask import redirect, request, session, render_template, url_for
from flask import flash
from impala import app
from impala.models import client, require_mpd
from mpd import ConnectionError, CommandError

import logging
logger = logging.getLogger('impala')

@app.route('/')
@require_mpd
def main():
    data = {
        'status': client.status(),
        'currentsong': client.currentsong(),
        'songtime': client.currentsong_time(),
    }
    return render_template('currentsong.html', **data)

@app.route('/connect', methods=['GET', 'POST'])
def connect():
    if request.method == 'GET':
        return render_template('connect.html')
    try:
        client.connect(request.form['server'], 6600)
        if request.form['password']:
            client.password(request.form['password'])
        session['server'] = request.form['server']
        session['port'] = 6600
        session['password'] = request.form['password']
    except (ConnectionError, OSError) as e:
        logger.error(e)
        flash(str(e))
    except CommandError as e:
        logger.error(e)
        flash(str(e))
        client.close()
        client.disconnect()
    return redirect(url_for('main'))

@app.route('/disconnect')
@require_mpd
def disconnect():
    client.close()
    client.disconnect()
    return redirect(url_for('main'))

@app.route('/play')
@require_mpd
def play():
    client.play()
    return 'OK'

@app.route('/pause')
@require_mpd
def pause():
    client.pause()
    return 'OK'
