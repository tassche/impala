from flask import flash, jsonify, redirect, render_template, request, url_for
from flask import g, session
from impala.models import MPDClient, mpdclient, redirect_on_error
from impala import app
from mpd import ConnectionError, CommandError

import logging
logger = logging.getLogger('impala')

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
        except (ConnectionError, OSError) as e:
            logger.error(e)
            flash(str(e))
            return render_template('connect.html')
        except CommandError as e:
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
