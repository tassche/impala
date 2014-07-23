from impala.utils import seconds_to_str
import mpd

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
