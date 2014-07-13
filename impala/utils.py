def seconds_to_dhms(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    d, h = divmod(h, 24)
    return d, h, m, s

def seconds_to_str(seconds):
    d, h, m, s = seconds_to_dhms(seconds)
    if d > 0:
        return '{:02d}d {:02d}:{:02d}:{:02d}'.format(d, h, m, s)
    if h > 0:
        return '{:02d}:{:02d}:{:02d}'.format(h, m, s)
    return '{:02d}:{:02d}'.format(m, s)

