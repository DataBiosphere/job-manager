from six import iteritems
from jobs.models.base_model_ import Model
from connexion.jsonifier import JSONEncoder as ConnexionJSONEncoder


class JSONEncoder(ConnexionJSONEncoder):
    include_nulls = False

    def default(self, o):
        if isinstance(o, Model):
            dikt = {}
            for attr, _ in iteritems(o.swagger_types):
                value = getattr(o, attr)
                if value is None and not self.include_nulls:
                    continue
                attr = o.attribute_map[attr]
                dikt[attr] = value
            return dikt
        return ConnexionJSONEncoder.default(self, o)
