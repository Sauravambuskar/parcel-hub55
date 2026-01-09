const BackgroundParticles = () => {
  const particles = [
    { size: 6, left: '10%', delay: '0s', duration: '20s' },
    { size: 8, left: '20%', delay: '2s', duration: '18s' },
    { size: 4, left: '30%', delay: '4s', duration: '22s' },
    { size: 10, left: '40%', delay: '1s', duration: '25s' },
    { size: 6, left: '50%', delay: '3s', duration: '19s' },
    { size: 8, left: '60%', delay: '5s', duration: '21s' },
    { size: 4, left: '70%', delay: '2s', duration: '23s' },
    { size: 12, left: '80%', delay: '4s', duration: '17s' },
    { size: 6, left: '90%', delay: '1s', duration: '24s' },
    { size: 8, left: '15%', delay: '6s', duration: '20s' },
    { size: 4, left: '45%', delay: '3s', duration: '22s' },
    { size: 10, left: '75%', delay: '5s', duration: '18s' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((particle, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-primary/20 animate-float-up"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.left,
            bottom: '-20px',
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundParticles;
