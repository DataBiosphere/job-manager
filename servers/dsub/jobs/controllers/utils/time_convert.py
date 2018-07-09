import datetime
from dateutil.tz import tzlocal

TIME_FRAME_MAP = {
    'HOURS_1': datetime.timedelta(minutes=60),
    'HOURS_8': datetime.timedelta(minutes=60 * 8),
    'HOURS_24': datetime.timedelta(days=1),
    'DAYS_7': datetime.timedelta(days=7),
    'DAYS_30': datetime.timedelta(days=30)
}


def time_frame_to_start_time(time_frame):
    """
    Map a time frame to start time.

    Args:
        time_frame_to_start_time (time_frame): 'HOURS_1', 'HOURS_8', 'HOURS_24',
        'DAYS_7', 'DAYS_30' or 'ALL_TIME'

    Returns:
        start_time: a datetime object that is the start time of query and None if it is 'ALL_TIME'.
    """

    if (time_frame == 'ALL_TIME'):
        return None

    return datetime.datetime.now(tz=tzlocal()) - TIME_FRAME_MAP[time_frame]
