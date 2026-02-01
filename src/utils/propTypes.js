import PropTypes from 'prop-types';

export const ServicePropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.string)
});

export const MenuPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired
});

export const ReviewPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  event: PropTypes.string.isRequired,
  guests: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
  image: PropTypes.string.isRequired,
  review: PropTypes.string.isRequired,
  highlights: PropTypes.arrayOf(PropTypes.string).isRequired
});

export const TeamMemberPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  specialty: PropTypes.string.isRequired,
  bio: PropTypes.string.isRequired
});
