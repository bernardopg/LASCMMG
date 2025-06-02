import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const PageHeaderBadge = ({ badge }) => {
  if (!badge) return null;

  const IconComponent = badge.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.7 }}
      className="inline-flex items-center space-x-3 bg-slate-700/30 backdrop-blur-xl rounded-full px-6 py-3 mb-8 border border-slate-600/50 shadow-md"
    >
      {IconComponent && (
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <IconComponent className="w-6 h-6 text-amber-400" />
        </motion.div>
      )}
      <span className="text-lg font-bold text-lime-300 tracking-wide">{badge.text}</span>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 bg-amber-400 rounded-full"
      />
    </motion.div>
  );
};

PageHeaderBadge.propTypes = {
  badge: PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
  }),
};

export default PageHeaderBadge;
