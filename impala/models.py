from impala.utils import seconds_to_str
import mpd

class MPDClient(mpd.MPDClient):
    def pretty_currentsong_time(self):
        '''The elapsed and total time of the current playing song.

        A dict with the elapsed time and the total time of the current
        playing song, nicely formatted.
        '''
        try:
            e, t = self.status()['time'].split(':')
        except KeyError:
            return dict()
        return {'elapsed': seconds_to_str(int(e)),
                'total': seconds_to_str(int(t))}
