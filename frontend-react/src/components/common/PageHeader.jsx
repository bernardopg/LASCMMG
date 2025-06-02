import PropTypes from 'prop-types';
import PageHeaderBadge from './PageHeaderBadge'; // Import the new PageHeaderBadge component
import StatCard from './StatCard';

/**
 * Componente reutilizável para cabeçalhos de página
 */
const PageHeader = ({
  title,
  subtitle,
  description,
  badge,
  titleGradient = 'from-amber-500 via-amber-600 to-amber-500',
  actions,
  stats,
}) => {
  return (
    <section className="relative z-10 mb-12">
      {/* Background Effects - Manter se forem estáticos ou CSS puro, remover se forem JS/Framer */}
      {/* A animação abaixo é do framer-motion, será removida ou simplificada para CSS se possível */}
      {/* <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute top-1/4 right-0 w-96 h-96 bg-gradient-radial ${backgroundGradient} rounded-full blur-3xl`}
        />
      </div> */}
      {/* Efeito de background estático ou via CSS pode ser considerado aqui se necessário */}

      <div className="text-center mb-12">
        <PageHeaderBadge badge={badge} />

        {/* <motion.h1 // Remover motion
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-5xl md:text-6xl font-black mb-6 leading-tight"
        > */}
        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          {' '}
          {/* Substituir por h1 normal */}
          {subtitle && <span className="block text-green-800">{subtitle}</span>}
          <span className={`block bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent`}>
            {title}
          </span>
        </h1>
        {/* </motion.h1> */}

        {/* <motion.div // Remover motion
          initial={{ width: 0 }}
          animate={{ width: '40%' }}
          transition={{ delay: 1, duration: 1.2, ease: 'circOut' }}
          className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8 rounded-full"
        /> */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-8 rounded-full w-[40%]">
          {' '}
          {/* Substituir por div normal e aplicar width diretamente */}
        </div>

        {description && (
          // <motion.p // Remover motion
          //   initial={{ opacity: 0, y: 20 }}
          //   animate={{ opacity: 1, y: 0 }}
          //   transition={{ delay: 0.6, duration: 0.8 }}
          //   className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          // >
          <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {' '}
            {/* Substituir por p normal */}
            {description}
          </p>
          // </motion.p>
        )}
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        // <motion.div // Remover motion
        //   initial={{ opacity: 0, y: 30 }}
        //   animate={{ opacity: 1, y: 0 }}
        //   transition={{ delay: 0.8, duration: 0.8, staggerChildren: 0.1 }}
        //   className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        // >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {' '}
          {/* Substituir por div normal */}
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
        // </motion.div>
      )}

      {/* Actions */}
      {actions && (
        // <motion.div // Remover motion
        //   initial={{ opacity: 0, y: 20 }}
        //   animate={{ opacity: 1, y: 0 }}
        //   transition={{ delay: 1, duration: 0.6 }}
        //   className="flex justify-center"
        // >
        <div className="flex justify-center">
          {' '}
          {/* Substituir por div normal */}
          {actions}
        </div>
        // </motion.div>
      )}
    </section>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  badge: PropTypes.shape({
    text: PropTypes.string.isRequired,
    icon: PropTypes.elementType,
  }),
  backgroundGradient: PropTypes.string,
  titleGradient: PropTypes.string,
  actions: PropTypes.node,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      icon: PropTypes.elementType,
      bgColor: PropTypes.string,
      iconColor: PropTypes.string,
    })
  ),
};

export default PageHeader;
