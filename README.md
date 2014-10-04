Impala
======

Web application that allows you to control a MPD server.


Quickstart
----------

### Requirements

  * Python 3.3 or higher


### Setup

    $ git clone https://github.com/vetl/impala.git
    $ cd impala
    $ pyvenv venv
    $ wget https://bootstrap.pypa.io/get-pip.py
    $ . venv/bin/activate
    (venv) $ python get-pip.py
    (venv) $ pip install -r requirements.txt gunicorn
    (venv) $ deactivate


### Configuration

Edit `config.py` to set the MPD server details and to configure some options.


### Running Impala

    $ cd impala
    $ . venv/bin/activate
    (venv) $ gunicorn -b 0.0.0.0:6000 impala:app

