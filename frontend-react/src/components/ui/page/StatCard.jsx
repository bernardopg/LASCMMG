import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const StatCard = ({ stat, index }) => {
  const IconComponent = stat.icon;
  return (
    <motion.div
      key={stat.label} // Assuming label is unique for keying
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }} // Stagger based on index
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative bg-gradient-to-br ${stat.bgColor || 'from-slate-700/50 to-slate-800/50'}
                 backdrop-blur-xl border border-slate-600/50
                 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-300 mb-1">{stat.label}</p>
          <motion.p
            key={stat.value} // Animate value change if it occurs
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-neutral-100"
          >
            {stat.value}
          </motion.p>
        </div>
        {IconComponent && (
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`p-4 bg-gradient-to-r ${stat.iconColor || 'from-green-500 to-green-600'} rounded-2xl shadow-lg`}
          >
            <IconComponent className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

StatCard.propTypes = {
  stat: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType,
    bgColor: PropTypes.string, // e.g., 'from-blue-100/80 to-indigo-100/80'
    iconColor: PropTypes.string, // e.g., 'from-blue-500 to-blue-600'
  }).isRequired,
  index: PropTypes.number, // For staggered animation delay
};

export default StatCard;
