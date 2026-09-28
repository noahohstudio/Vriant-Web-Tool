// The concept map: courses → units → concepts, from docs/curriculum.md. It ships with the app (templates don't),
// so detection and the topic picker work before any course file loads. Keywords are lowercase clues for detection.

export type Level = 'core' | 'common' | 'occasional';
export type Concept = { id: string; name: string; level: Level; cooper: boolean; kw: string[]; unit: Unit; course: Course };
export type Unit = { id: string; name: string; label: string; concepts: Concept[] };
export type Course = { id: string; name: string; code: string; subject: 'physics' | 'maths'; units: Unit[] };

type C = [key: string, name: string, level: 'c' | 'm' | 'o', cooper: 0 | 1, kw: string];
type U = [key: string, name: string, label: string, concepts: C[]];
const LEVEL = { c: 'core', m: 'common', o: 'occasional' } as const;

function course(id: string, name: string, code: string, subject: Course['subject'], units: U[]): Course {
  const c: Course = { id, name, code, subject, units: [] };
  for (const [ukey, uname, label, concepts] of units) {
    const u: Unit = { id: `${id}.${ukey}`, name: uname, label, concepts: [] };
    for (const [key, cname, level, cooper, kw] of concepts) {
      u.concepts.push({ id: `${u.id}.${key}`, name: cname, level: LEVEL[level], cooper: !!cooper, kw: kw.split('|'), unit: u, course: c });
    }
    c.units.push(u);
  }
  return c;
}

export const COURSES: Course[] = [
  course('phys1', 'Physics I: Mechanics', 'Ph 112', 'physics', [
    ['meas', 'Measurement and vectors', 'Measurement', [
      ['units', 'Unit conversion and dimensional analysis', 'm', 0, 'convert|conversion|dimensional analysis|units of|in meters per second|in metres per second|km/h|mi/h|mph|in kilograms per|g/cm|cubic meter|scientific notation|significant figures'],
      ['vectors', 'Vector components, magnitude and direction', 'm', 0, 'component|resultant|magnitude and direction|north of east|east of north|south of west|west of north|vector sum|displacement vector|unit vector|add the vectors|vector a|vector b'],
    ]],
    ['kin1d', 'Motion in one dimension', 'Kinematics', [
      ['constAccel', 'Constant-acceleration motion', 'c', 1, 'from rest|decelerat|uniformly|brakes|speeds up|slows down|constant acceleration|stopping distance|runway|comes to a stop|to stop|how long does it take to stop|accelerat|accelerates at|final velocity'],
      ['freeFall', 'Free fall', 'c', 1, 'dropped|falls|free fall|freely falling|thrown straight up|thrown upward|thrown vertically|straight up|straight down|ledge|scaffold|how high|hits the ground|reach the ground|g = 9.8|fall|falls from|how tall|bridge|off a|into the water'],
      ['graphs', 'Motion graphs: slopes and areas', 'm', 1, 'graph|v-t|x-t|a-t|velocity-time|position-time|acceleration-time|slope|area under|from the graph'],
      ['calculus', 'Position, velocity and acceleration with calculus', 'm', 1, 'x(t)|v(t)|a(t)|position function|instantaneous velocity|instantaneous acceleration|dx/dt|dv/dt|position is x|velocity is v'],
    ]],
    ['kin2d', 'Motion in two dimensions', '2-D motion', [
      ['projectile', 'Projectile motion', 'c', 1, 'projectile|launched|above the horizontal|horizontally|horizontal range|time of flight|kicked|rolls off|lands|trajectory|muzzle|cannonball|long jump|at an angle|in the air|angle of|degrees above|golf|arrow|leaves the|thrown at'],
      ['relative', 'Relative velocity', 'm', 1, 'relative to the|river|downstream|upstream|boat|swimmer|headwind|tailwind|wind blows|crosswind|airspeed|ground speed|toward each other|relative velocity|current flows'],
      ['circular', 'Uniform circular motion', 'c', 1, 'circle|circular|centripetal|revolution|rpm|centrifuge|period of rotation|around a track'],
    ]],
    ['newton', 'Newton’s laws', 'Newton’s laws', [
      ['netForce', 'Net force and acceleration', 'c', 1, 'net force|newton\'s second|second law|f = ma|f=ma|push|pull|two forces|forces act|frictionless floor|frictionless surface|third law|action-reaction'],
      ['incline', 'Inclined planes', 'c', 1, 'incline|inclined|ramp|slope|tilted|down the slope|up the slope|angle of the ramp'],
      ['pulleys', 'Tension, pulleys and connected objects', 'c', 1, 'pulley|tension|rope|string|atwood|connected|hanging|tied|cord'],
      ['friction', 'Friction, static and kinetic', 'c', 1, 'friction|coefficient of|static friction|kinetic friction|rough|μk|μs|μ ='],
      ['apparentWeight', 'Apparent weight', 'm', 1, 'elevator|scale reads|scale read|apparent weight|bathroom scale|feel heavier|feel lighter|weightless|scale inside|reads the scale|on a scale'],
      ['circularDyn', 'Circular-motion dynamics', 'c', 1, 'banked|curve|loop|conical|whirled|flat curve|rounds a|around a curve|vertical circle|top of the loop|skid|without slipping off'],
      ['drag', 'Drag and terminal velocity', 'o', 0, 'drag|air resistance|terminal|resistive force|bv^2|proportional to speed|proportional to its speed'],
      ['nonInertial', 'Non-inertial frames', 'o', 1, 'non-inertial|accelerating frame|fictitious|pseudo-force|pseudo force|from the ceiling|hangs from the ceiling|as seen by a passenger|in the frame of'],
    ]],
    ['energy', 'Work and energy', 'Energy', [
      ['workConst', 'Work by a constant force', 'c', 1, 'work done|how much work|joules|work does|work is done|work by|work on'],
      ['workVar', 'Work by a variable force', 'm', 1, 'spring|stretch|compress|variable force|f(x)|hooke|force f(x)|from x =|work to stretch|compress a spring|stretch a spring|spring (k'],
      ['workEnergy', 'Work–energy theorem', 'c', 1, 'work-energy|work–energy|kinetic energy|net work|change in kinetic energy'],
      ['conservation', 'Conservation of mechanical energy', 'c', 1, 'conservation of energy|potential energy|mechanical energy|roller coaster|frictionless hill|conservation of mechanical|top of the hill|released from|hill|energy methods|use energy|energy conservation'],
      ['friction', 'Energy with friction', 'c', 1, 'thermal energy|energy lost|dissipated|non-conservative|loses energy|energy to friction|rough patch|work done by friction'],
      ['power', 'Power', 'm', 0, 'power|watt|kw|horsepower|hp|rate of doing work|watts|stairs|climbs|flight of stairs|average power|develop'],
    ]],
    ['mom', 'Momentum and systems', 'Momentum', [
      ['impulse', 'Impulse and average force', 'c', 1, 'impulse|average force|contact|n·s|n s|bounces|rebounds|contact time|lasts|in contact'],
      ['conservation', 'Conservation of momentum and recoil', 'c', 1, 'momentum|recoil|push apart|cannon|explodes|explosion|throws|conservation of momentum|firecracker'],
      ['inelastic', 'Perfectly inelastic collisions', 'c', 1, 'stick together|stick|embeds|coupled|perfectly inelastic|inelastic|ballistic|lodges|rear-ends|clay|hits and sticks|lump|sticks to'],
      ['elastic', 'Elastic collisions in one dimension', 'c', 1, 'elastic collision|head-on|perfectly elastic|elastic'],
      ['twoD', 'Collisions in two dimensions', 'm', 1, 'at right angles|glancing|two-dimensional|two dimensions|momentum components|moving north|moving east|angle after the collision'],
      ['com', 'Center of mass', 'm', 1, 'center of mass|centre of mass|locate the center|linear density'],
      ['rocket', 'Rockets and variable mass', 'o', 0, 'rocket|exhaust|thrust|fuel|burns'],
    ]],
    ['rot', 'Rotation', 'Rotation', [
      ['kinematics', 'Rotational kinematics', 'c', 1, 'angular velocity|angular acceleration|rad/s|rpm|revolutions|angular speed|angular displacement|rev/s|angular deceleration'],
      ['inertia', 'Moment of inertia', 'c', 1, 'moment of inertia|rotational inertia|parallel-axis|parallel axis|about an axis through'],
      ['torque', 'Torque and angular acceleration', 'c', 1, 'torque|lever arm|wrench|n·m|moment arm'],
      ['energy', 'Rotational kinetic energy', 'c', 1, 'rotational kinetic|flywheel|kinetic energy of rotation|rotational energy|stores'],
      ['rolling', 'Rolling without slipping', 'm', 1, 'rolls|rolling|without slipping|roll down|hoop|solid sphere|disk rolls'],
      ['angMom', 'Angular momentum and its conservation', 'c', 1, 'angular momentum|pulls in her arms|pulls in his arms|skater|turntable|merry-go-round|spinning stool|jumps onto|spin rate'],
    ]],
    ['statics', 'Static equilibrium', 'Statics', [
      ['beams', 'Beams and supports', 'm', 1, 'equilibrium|beam|support|seesaw|plank|reaction|balanced|pivot|fulcrum'],
      ['ladders', 'Ladders and hinged booms', 'm', 1, 'ladder|leans|hinged|boom|strut|against a wall|frictionless wall|ladder leans'],
    ]],
    ['grav', 'Gravitation', 'Gravitation', [
      ['law', 'Newton’s law of gravitation', 'm', 0, 'gravitational force|law of gravitation|universal gravitation|g = 6.67|6.67|surface gravity|gravitational acceleration at|twice earth\'s mass'],
      ['orbits', 'Orbits: speed, period, Kepler’s third law', 'm', 0, 'orbit|orbital|satellite|kepler|geosynchronous|altitude'],
      ['escape', 'Escape speed and gravitational potential energy', 'm', 0, 'escape speed|escape velocity|gravitational potential energy|-gm|−gm|very large distance|to infinity'],
    ]],
    ['osc', 'Oscillations', 'Oscillations', [
      ['spring', 'Mass–spring oscillator', 'c', 1, 'oscillat|simple harmonic|spring constant|on a spring|mass-spring|period and frequency|shm'],
      ['pendulum', 'Simple pendulum', 'c', 1, 'simple pendulum|pendulum|swings|length should'],
      ['energy', 'Energy in simple harmonic motion', 'm', 1, 'total mechanical energy|total energy|kinetic energy equal|equal to the potential energy|energy in simple harmonic|energy of the oscillator|at what displacement'],
      ['physical', 'Physical pendulum', 'o', 0, 'physical pendulum|pivot|meter stick|swings from|about a point on its rim|small oscillations'],
    ]],
    ['fluids', 'Fluids', 'Fluids', [
      ['pressure', 'Pressure with depth', 'o', 0, 'pressure|depth|gauge pressure|absolute pressure|hydraulic|piston|atm|pascal|manometer|barometer'],
      ['buoyancy', 'Buoyancy', 'o', 0, 'buoyant|buoyancy|floats|float|submerged|archimedes|displaced|in water|apparent weight in water'],
      ['bernoulli', 'Continuity and Bernoulli’s equation', 'o', 0, 'bernoulli|continuity|pipe|flow rate|narrows|venturi|hole|tank|flows through'],
    ]],
  ]),

  course('calc1', 'Calculus I', 'Ma 111', 'maths', [
    ['limits', 'Limits and continuity', 'Limits', [
      ['algebraic', 'Evaluating limits algebraically', 'c', 1, 'lim|limit|approaches|x→|x->'],
      ['continuity', 'One-sided limits and continuity', 'c', 1, 'continuous|continuity|one-sided|left-hand|right-hand|piecewise'],
      ['infinity', 'Limits at infinity and horizontal asymptotes', 'c', 1, 'infinity|∞|horizontal asymptote|end behavior'],
      ['trigLimits', 'Special trig limits', 'm', 0, 'sin x / x|sin(x)/x|1 − cos|1 - cos'],
    ]],
    ['deriv', 'Derivatives', 'Derivatives', [
      ['definition', 'Derivative from the definition', 'c', 1, 'definition of the derivative|limit definition|difference quotient|h→0'],
      ['rules', 'Power, product and quotient rules', 'c', 1, 'derivative|differentiate|product rule|quotient rule|power rule|d/dx'],
      ['chain', 'Chain rule', 'c', 1, 'chain rule|composite'],
      ['trig', 'Trigonometric derivatives', 'c', 1, 'sin|cos|tan|sec'],
      ['expLog', 'Exponential and logarithmic derivatives', 'c', 1, 'e^|exponential|ln|natural log'],
      ['hyperbolic', 'Hyperbolic functions', 'o', 1, 'sinh|cosh|tanh|hyperbolic'],
      ['implicit', 'Implicit differentiation', 'c', 0, 'implicit|implicitly'],
      ['inverse', 'Inverse functions and inverse trig', 'm', 0, 'inverse|arcsin|arctan|arccos|sin⁻¹|tan⁻¹'],
      ['logDiff', 'Logarithmic differentiation', 'm', 0, 'logarithmic differentiation|x^x'],
      ['higher', 'Higher-order derivatives', 'm', 0, 'second derivative|third derivative|f″|d²y'],
    ]],
    ['apps', 'Applications of derivatives', 'Applications', [
      ['tangent', 'Tangent lines', 'c', 1, 'tangent line|equation of the tangent|normal line'],
      ['linearApprox', 'Linear approximation and differentials', 'm', 0, 'linear approximation|linearization|differential|estimate'],
      ['relatedRates', 'Related rates', 'c', 1, 'related rates|how fast|ladder|balloon|cone|shadow|draining'],
      ['motion', 'Motion along a line', 'm', 1, 'particle moves|s(t)|velocity|acceleration'],
      ['extrema', 'Critical points and absolute extrema', 'c', 1, 'critical point|absolute max|absolute min|closed interval|extrema'],
      ['concavity', 'Concavity and inflection points', 'c', 1, 'concave|concavity|inflection|curve sketching'],
      ['optimization', 'Optimization', 'c', 1, 'maximize|minimize|largest|smallest|least|fence|box'],
      ['mvt', 'Mean Value Theorem', 'm', 0, 'mean value theorem|rolle'],
      ['lhopital', 'L’Hôpital’s rule', 'm', 0, 'l’hôpital|l\'hôpital|l\'hopital|indeterminate'],
      ['newton', 'Newton’s method', 'o', 0, 'newton’s method|newton\'s method|approximate a root'],
    ]],
    ['integ', 'Integrals', 'Integrals', [
      ['antideriv', 'Antiderivatives and initial-value problems', 'c', 1, 'antiderivative|indefinite integral|initial condition'],
      ['riemann', 'Riemann sums', 'm', 0, 'riemann|left endpoint|right endpoint|midpoint|subintervals'],
      ['ftc', 'Definite integrals and the Fundamental Theorem', 'c', 1, 'definite integral|fundamental theorem|evaluate the integral|∫'],
      ['ftc1', 'Derivative of an integral', 'm', 1, 'derivative of the integral|accumulation function'],
      ['substitution', 'Substitution', 'c', 1, 'substitution|u-sub|u ='],
      ['area', 'Area under and between curves', 'm', 1, 'area between|area under|bounded by|enclosed'],
      ['average', 'Average value of a function', 'm', 0, 'average value'],
      ['growth', 'Exponential growth and decay', 'm', 0, 'half-life|doubling|grows exponentially|decay|population'],
    ]],
  ]),

  course('calc2', 'Calculus II', 'Ma 113', 'maths', [
    ['tech', 'Techniques of integration', 'Techniques', [
      ['parts', 'Integration by parts', 'c', 1, 'integration by parts|by parts'],
      ['trigInt', 'Trig integrals and trig substitution', 'c', 1, 'trig substitution|trigonometric substitution|sin²|cos²'],
      ['partialFrac', 'Partial fractions', 'c', 1, 'partial fraction'],
      ['numerical', 'Numerical integration', 'm', 0, 'trapezoid|trapezoidal|simpson'],
      ['improper', 'Improper integrals', 'c', 1, 'improper'],
    ]],
    ['apps', 'Applications of integration', 'Applications', [
      ['disks', 'Volumes by disks and washers', 'c', 1, 'volume|revolved|rotated about|solid of revolution|disk|washer'],
      ['shells', 'Volumes by cylindrical shells', 'c', 1, 'shell|cylindrical shells'],
      ['crossSections', 'Volumes by cross-sections', 'm', 1, 'cross-section|cross section|perpendicular to the x-axis'],
      ['arcLength', 'Arc length', 'c', 1, 'arc length|length of the curve'],
      ['surface', 'Surface area of revolution', 'm', 1, 'surface area'],
      ['work', 'Work: springs, pumping, cables', 'm', 1, 'work|pump|tank|cable|chain'],
      ['centroid', 'Centroids and center of mass', 'm', 1, 'centroid|center of mass|centre of mass'],
    ]],
    ['de', 'Differential equations', 'Differential equations', [
      ['separable', 'Separable equations', 'm', 0, 'differential equation|separable|separation of variables'],
      ['logistic', 'Logistic growth', 'o', 0, 'logistic|carrying capacity'],
      ['euler', 'Euler’s method', 'o', 0, 'euler’s method|euler\'s method|step size'],
    ]],
    ['param', 'Parametric and polar', 'Parametric & polar', [
      ['paramDeriv', 'Parametric derivatives and tangent lines', 'c', 1, 'parametric|x(t)|y(t)'],
      ['paramLength', 'Speed and arc length of parametric curves', 'm', 1, 'speed|arc length'],
      ['motion3d', 'Velocity and acceleration in 2-D and 3-D', 'm', 1, 'r(t)|position vector|velocity vector|space curve'],
      ['polar', 'Polar coordinates and polar area', 'c', 1, 'polar|cardioid|rose|limaçon'],
    ]],
    ['partial', 'Partial derivatives', 'Partial derivatives', [
      ['partials', 'Partial derivatives', 'm', 1, 'partial derivative|∂|f(x, y)'],
      ['chain', 'Multivariable chain rule', 'm', 1, 'dz/dt|∂z/∂'],
      ['gradient', 'Gradient and directional derivatives', 'm', 1, 'gradient|directional derivative|∇'],
      ['extrema', 'Local extrema and the second-derivative test', 'm', 1, 'saddle|local maximum|local minimum|second derivative test'],
    ]],
    ['series', 'Sequences and series', 'Series', [
      ['sequences', 'Limits of sequences', 'c', 1, 'sequence|aₙ|a_n'],
      ['geometric', 'Geometric and telescoping series', 'c', 1, 'geometric series|telescoping|sum of the series|∑|Σ'],
      ['tests', 'Convergence tests', 'c', 1, 'converge|diverge|ratio test|root test|comparison test|integral test|alternating'],
      ['power', 'Power series and radius of convergence', 'c', 1, 'power series|radius of convergence|interval of convergence'],
      ['taylor', 'Taylor and Maclaurin polynomials', 'c', 1, 'taylor|maclaurin'],
      ['error', 'Taylor error bounds', 'm', 0, 'error bound|remainder|lagrange'],
    ]],
  ]),

  course('linalg', 'Introduction to Linear Algebra', 'Ma 110', 'maths', [
    ['vectors', 'Vectors', 'Vectors', [
      ['algebra', 'Vector algebra, magnitude and unit vectors', 'c', 1, 'vector|magnitude|unit vector'],
      ['dot', 'Dot product and the angle between vectors', 'c', 1, 'dot product|angle between|orthogonal|perpendicular'],
      ['projection', 'Projections', 'c', 1, 'projection|proj'],
      ['cross', 'Cross product and area', 'c', 1, 'cross product|parallelogram|area of the triangle'],
      ['triple', 'Triple product and volume', 'c', 1, 'triple product|parallelepiped'],
    ]],
    ['geometry', 'Lines, planes and spheres', 'Lines & planes', [
      ['planes', 'Lines and planes', 'c', 1, 'plane|normal vector|line through'],
      ['distance', 'Distance from a point to a line or plane', 'c', 1, 'distance from the point|distance between'],
      ['angles', 'Angles between planes; where a line meets a plane', 'c', 1, 'angle between the planes|intersects the plane'],
      ['spheres', 'Spheres: center and radius', 'c', 1, 'sphere|center and radius|centre and radius'],
    ]],
    ['matrices', 'Matrices and systems', 'Matrices', [
      ['multiply', 'Matrix multiplication', 'c', 1, 'matrix|matrices|product ab'],
      ['systems', 'Solving linear systems', 'c', 1, 'system of equations|solve the system|elimination|row reduce|cramer'],
      ['determinants', 'Determinants', 'c', 1, 'determinant|det'],
      ['inverse', 'Inverse matrices', 'c', 1, 'inverse|invertible|a⁻¹'],
    ]],
    ['complex', 'Complex numbers', 'Complex numbers', [
      ['arithmetic', 'Complex arithmetic and modulus', 'c', 1, 'complex|modulus|conjugate|a + bi'],
      ['polar', 'Polar form, powers and roots', 'c', 1, 'polar form|de moivre|argument|roots of unity'],
    ]],
  ]),

  // ——— Wave 2 ———
  course('phys2', 'Physics II: Electricity and Magnetism', 'Ph 213', 'physics', [
    ['waves', 'Waves and sound', 'Waves', [
      ['speed', 'Wave speed, frequency and wavelength', 'c', 1, 'wavelength|frequency|wave speed|hz'],
      ['strings', 'Strings and standing waves', 'c', 1, 'standing wave|harmonic|fundamental|node|antinode'],
      ['intensity', 'Sound intensity and decibels', 'm', 1, 'decibel|db|intensity|loudness'],
      ['doppler', 'Doppler effect', 'm', 1, 'doppler|siren|approaching|receding'],
    ]],
    ['field', 'Electric charge and field', 'Electric field', [
      ['coulomb', 'Coulomb’s law and superposition', 'c', 1, 'coulomb|point charge|charges|μc|nc|electrostatic force'],
      ['pointField', 'Electric field of point charges', 'c', 1, 'electric field|n/c|field at'],
      ['gauss', 'Gauss’s law', 'c', 1, 'gauss|flux|gaussian surface|charged sphere|line of charge|sheet of charge'],
      ['uniformField', 'Charges in a uniform field', 'm', 1, 'uniform field|between the plates|deflect|electron beam'],
    ]],
    ['potential', 'Electric potential', 'Potential', [
      ['pointPotential', 'Potential and potential energy of point charges', 'c', 1, 'electric potential|potential energy|volts'],
      ['uniformPotential', 'Potential difference and electron-volts', 'c', 1, 'potential difference|electron-volt|ev|accelerated through'],
    ]],
    ['capacitance', 'Capacitance', 'Capacitance', [
      ['plates', 'Parallel-plate capacitors', 'c', 1, 'capacitor|capacitance|parallel-plate|farad|pf|μf'],
      ['combos', 'Capacitors in series and parallel', 'c', 1, 'capacitors in series|capacitors in parallel|equivalent capacitance'],
      ['energy', 'Stored energy and dielectrics', 'm', 1, 'stored energy|dielectric'],
    ]],
    ['circuits', 'Current and DC circuits', 'Circuits', [
      ['resistivity', 'Resistivity and resistance', 'm', 1, 'resistivity|resistance of a wire|ω·m'],
      ['ohm', 'Ohm’s law and electrical power', 'c', 1, 'ohm|current|voltage|power dissipated|resistor'],
      ['combos', 'Series and parallel resistors', 'c', 1, 'series|parallel|equivalent resistance'],
      ['kirchhoff', 'Kirchhoff’s rules', 'c', 1, 'kirchhoff|loop rule|junction rule|two batteries'],
      ['rc', 'RC circuits', 'c', 1, 'rc circuit|time constant|charging|discharging'],
    ]],
    ['magnetism', 'Magnetism', 'Magnetism', [
      ['movingCharge', 'Force on a moving charge', 'c', 1, 'magnetic force|lorentz|cyclotron|radius of the path|tesla'],
      ['wireForce', 'Force on wires and torque on loops', 'c', 1, 'current-carrying wire|force on a wire|torque on a loop|magnetic moment'],
      ['fields', 'Magnetic fields of wires and solenoids', 'c', 1, 'biot|ampère|ampere|solenoid|long straight wire|magnetic field of'],
    ]],
    ['induction', 'Electromagnetic induction', 'Induction', [
      ['faraday', 'Faraday’s and Lenz’s laws', 'c', 1, 'faraday|induced emf|lenz|changing magnetic field'],
      ['motional', 'Motional EMF', 'm', 1, 'motional emf|rails|sliding bar|rod moving'],
      ['inductance', 'Inductance and LR circuits', 'c', 1, 'inductor|inductance|henry|lr circuit'],
    ]],
    ['ac', 'AC circuits and electromagnetic waves', 'AC & EM waves', [
      ['ac', 'Reactance, impedance and resonance', 'c', 1, 'reactance|impedance|resonance|rms|alternating current'],
      ['lc', 'LC oscillation', 'm', 1, 'lc circuit|oscillation frequency'],
      ['emWaves', 'Electromagnetic waves', 'c', 1, 'electromagnetic wave|speed of light|radio|photon flux'],
    ]],
  ]),

  course('stats', 'Probability and Statistics', 'Ma 224.1', 'maths', [
    ['describe', 'Describing data', 'Describing data', [
      ['center', 'Mean, median and standard deviation', 'c', 0, 'mean|median|standard deviation|variance|data set'],
      ['zscores', 'z-scores and percentiles', 'c', 0, 'z-score|z score|percentile|standardized'],
    ]],
    ['prob', 'Probability', 'Probability', [
      ['rules', 'Probability rules and conditional probability', 'c', 1, 'probability|conditional|independent|mutually exclusive'],
      ['bayes', 'Bayes’ theorem', 'c', 1, 'bayes|false positive|test accuracy|given that'],
      ['counting', 'Counting: permutations and combinations', 'c', 1, 'permutation|combination|arrangements|how many ways'],
    ]],
    ['rv', 'Random variables', 'Random variables', [
      ['expectation', 'Expected value and variance', 'c', 1, 'expected value|expectation|random variable'],
      ['binomial', 'Binomial distribution', 'c', 1, 'binomial|successes|trials'],
      ['poisson', 'Poisson and geometric distributions', 'c', 1, 'poisson|geometric|rate per|arrivals|first success'],
      ['continuous', 'Uniform and exponential distributions', 'c', 1, 'uniform distribution|exponential distribution|waiting time|density'],
      ['normal', 'Normal probabilities', 'c', 1, 'normal distribution|bell curve|normally distributed'],
      ['mgf', 'Moment-generating functions', 'm', 1, 'moment-generating|moment generating|mgf'],
    ]],
    ['inference', 'Inference', 'Inference', [
      ['clt', 'Sampling distributions and the CLT', 'c', 1, 'central limit|sampling distribution|standard error|sample mean'],
      ['ci', 'Confidence intervals', 'c', 1, 'confidence interval|margin of error'],
      ['tests', 'Hypothesis tests: z and t', 'c', 1, 'hypothesis test|p-value|null hypothesis|t-test|z-test|significance'],
      ['chisq', 'Chi-square tests', 'c', 1, 'chi-square|chi square|goodness of fit|contingency'],
      ['anova', 'One-way ANOVA', 'm', 1, 'anova|analysis of variance|f-statistic'],
    ]],
    ['regression', 'Relationships between variables', 'Regression', [
      ['regression', 'Linear regression and correlation', 'c', 0, 'regression|correlation|least squares|line of best fit'],
    ]],
  ]),

  course('diffeq', 'Differential Equations', 'Ma 240', 'maths', [
    ['first', 'First-order equations', 'First order', [
      ['linear', 'Separable and linear first-order equations', 'c', 1, 'separable|integrating factor|first-order'],
      ['models', 'Cooling, mixing and growth models', 'c', 1, 'cooling|mixing|tank|brine|growth rate'],
    ]],
    ['second', 'Second-order equations', 'Second order', [
      ['constCoef', 'Constant-coefficient linear equations', 'c', 1, 'characteristic equation|second-order|homogeneous'],
      ['oscillators', 'Damped and forced oscillators', 'c', 1, 'damped|forced|resonance|underdamped'],
    ]],
    ['systems', 'Systems', 'Systems', [
      ['eigen', 'Eigenvalues and eigenvectors', 'c', 1, 'eigenvalue|eigenvector|characteristic polynomial'],
      ['linearSystems', 'Linear systems of ODEs', 'c', 1, 'system of differential equations|x′ = ax'],
      ['phasePlane', 'Phase-plane equilibria', 'm', 1, 'phase plane|equilibrium|saddle|spiral|stability'],
    ]],
    ['transforms', 'Transforms and series', 'Transforms', [
      ['laplace', 'Laplace transforms', 'c', 1, 'laplace'],
      ['fourier', 'Fourier series coefficients', 'c', 1, 'fourier series|fourier coefficient'],
    ]],
  ]),

  course('vcalc', 'Vector Calculus', 'Ma 223', 'maths', [
    ['multiple', 'Multiple integrals', 'Multiple integrals', [
      ['double', 'Double integrals', 'c', 1, 'double integral|iterated integral|∬'],
      ['polar', 'Double integrals in polar coordinates', 'c', 1, 'polar coordinates|r dr dθ'],
      ['triple', 'Triple integrals: cylindrical and spherical', 'c', 1, 'triple integral|cylindrical|spherical|∭'],
      ['mass', 'Mass, center of mass and moments of inertia', 'c', 1, 'lamina|center of mass|moment of inertia|density function'],
    ]],
    ['fields', 'Vector fields', 'Vector fields', [
      ['divCurl', 'Divergence and curl', 'c', 1, 'divergence|curl|∇·|∇×'],
      ['line', 'Line integrals', 'c', 1, 'line integral|work along|circulation'],
      ['conservative', 'Conservative fields and potentials', 'c', 1, 'conservative|potential function|path independent'],
      ['green', 'Green’s theorem', 'c', 1, 'green’s theorem|green\'s theorem|closed curve'],
      ['flux', 'Flux, Stokes’ and divergence theorems', 'm', 0, 'flux|stokes|divergence theorem|surface integral'],
    ]],
  ]),

  // ——— Wave 3 ———
  course('phys3', 'Physics III: Optics and Modern Physics', 'Ph 214', 'physics', [
    ['optics', 'Geometric optics', 'Optics', [
      ['snell', 'Snell’s law and the critical angle', 'c', 1, 'snell|refraction|index of refraction|critical angle|total internal reflection'],
      ['lenses', 'Thin lenses and mirrors', 'c', 1, 'lens|mirror|focal length|image distance|magnification'],
    ]],
    ['wave', 'Physical optics', 'Physical optics', [
      ['interference', 'Interference and diffraction', 'c', 1, 'double slit|interference|fringe|grating|diffraction|thin film'],
      ['polarization', 'Polarization', 'm', 1, 'polariz|malus|polarizer'],
    ]],
    ['quantum', 'Quantum physics', 'Quantum', [
      ['photoelectric', 'Photons and the photoelectric effect', 'c', 1, 'photoelectric|work function|photon energy|stopping potential'],
      ['compton', 'Compton scattering', 'm', 1, 'compton|scattered photon|wavelength shift'],
      ['deBroglie', 'de Broglie wavelength', 'c', 1, 'de broglie|matter wave'],
      ['bohr', 'Bohr model and spectra', 'c', 1, 'bohr|hydrogen|energy level|spectral line'],
    ]],
    ['modern', 'Relativity and nuclei', 'Modern physics', [
      ['relativity', 'Special relativity', 'm', 0, 'relativity|time dilation|length contraction|lorentz factor'],
      ['decay', 'Radioactive decay', 'm', 0, 'half-life|radioactive|decay constant|activity'],
    ]],
  ]),

  course('statics', 'Statics and Strength of Materials', 'ME 103 · ESC 201', 'physics', [
    ['equilibrium', 'Equilibrium', 'Equilibrium', [
      ['particles', 'Particle equilibrium and cables', 'c', 1, 'equilibrium|cable|hanging from two'],
      ['moments', 'Moments and couples', 'c', 1, 'moment|couple|about point'],
      ['beams', 'Beam reactions', 'c', 1, 'reaction|simply supported|distributed load|kn/m|cantilever'],
      ['trusses', 'Trusses: the method of joints', 'c', 1, 'truss|method of joints|member force'],
    ]],
    ['sections', 'Section properties', 'Sections', [
      ['centroids', 'Centroids and area moments of inertia', 'c', 1, 'centroid|second moment of area|area moment'],
    ]],
    ['strength', 'Strength of materials', 'Strength', [
      ['axial', 'Axial stress and strain', 'c', 1, 'stress|strain|elongation|young’s modulus|axial'],
      ['shearMoment', 'Shear force and bending moment', 'c', 1, 'shear force|bending moment|moment diagram'],
      ['bending', 'Bending stress', 'c', 1, 'bending stress|flexure|section modulus'],
    ]],
  ]),

  course('precalc', 'Precalculus and College Algebra', 'Gateway', 'maths', [
    ['functions', 'Functions and equations', 'Functions', [
      ['expLog', 'Exponential and logarithmic equations', 'c', 0, 'logarithm|log|exponential equation|compound interest'],
      ['systems', 'Systems of equations', 'c', 0, 'system of equations|two equations'],
      ['sequences', 'Arithmetic and geometric sequences', 'c', 0, 'arithmetic sequence|geometric sequence|nth term|common ratio'],
    ]],
    ['trig', 'Trigonometry', 'Trigonometry', [
      ['rightTri', 'Right-triangle trigonometry', 'c', 0, 'right triangle|opposite|adjacent|hypotenuse|angle of elevation'],
      ['lawSines', 'Law of sines and cosines', 'c', 0, 'law of sines|law of cosines|oblique triangle'],
      ['trigEq', 'Trig equations', 'c', 0, 'trig equation|solve sin|solve cos'],
    ]],
  ]),
];

export const CONCEPTS = new Map<string, Concept>(COURSES.flatMap((c) => c.units.flatMap((u) => u.concepts.map((k) => [k.id, k] as const))));
export const conceptName = (id: string | null | undefined) => (id && CONCEPTS.get(id)?.name) || 'Unknown concept';
/** The short label shown above a question, e.g. "Kinematics". */
export const unitLabel = (conceptId: string) => CONCEPTS.get(conceptId)?.unit.label ?? '';
