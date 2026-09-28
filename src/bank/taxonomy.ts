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
      ['units', 'Unit conversion and dimensional analysis', 'm', 0, 'convert|conversion|dimensional analysis|in metres per second|in meters per second|express'],
      ['vectors', 'Vector components, magnitude and direction', 'm', 0, 'component|vector|magnitude|resultant|east|north'],
    ]],
    ['kin1d', 'Motion in one dimension', 'Kinematics', [
      ['constAccel', 'Constant-acceleration motion', 'c', 1, 'accelerat|from rest|decelerat|uniformly|brakes|speeds up|m/s²|m/s^2'],
      ['freeFall', 'Free fall', 'c', 1, 'dropped|falls|free fall|thrown straight up|thrown upward|ledge|g = 9.8'],
      ['graphs', 'Motion graphs: slopes and areas', 'm', 1, 'graph|v–t|x–t|velocity–time|position–time|slope|area under'],
      ['calculus', 'Position, velocity and acceleration with calculus', 'm', 1, 'x(t)|v(t)|a(t)|position function|instantaneous velocity'],
    ]],
    ['kin2d', 'Motion in two dimensions', '2-D motion', [
      ['projectile', 'Projectile motion', 'c', 1, 'projectile|launched|above the horizontal|horizontally|range|maximum height|time of flight|kicked'],
      ['relative', 'Relative velocity', 'm', 1, 'relative to|river|current|boat|swimmer|headwind|tailwind|toward each other'],
      ['circular', 'Uniform circular motion', 'c', 1, 'circle|circular|centripetal|revolution|rpm'],
    ]],
    ['newton', 'Newton’s laws', 'Newton’s laws', [
      ['netForce', 'Net force and acceleration', 'c', 1, 'net force|newton’s second|f = ma|push|pull|force of'],
      ['incline', 'Inclined planes', 'c', 1, 'incline|ramp|slope|tilted'],
      ['pulleys', 'Tension, pulleys and connected objects', 'c', 1, 'pulley|tension|rope|string|atwood|connected|hanging|tied'],
      ['friction', 'Friction, static and kinetic', 'c', 1, 'friction|coefficient|μ|static friction|kinetic friction|rough'],
      ['apparentWeight', 'Apparent weight', 'm', 1, 'elevator|scale reads|apparent weight'],
      ['circularDyn', 'Circular-motion dynamics', 'c', 1, 'banked|curve|loop|conical|whirled|flat curve'],
      ['drag', 'Drag and terminal velocity', 'o', 0, 'drag|air resistance|terminal'],
      ['nonInertial', 'Non-inertial frames', 'o', 1, 'non-inertial|accelerating frame|fictitious|pseudo-force|from the ceiling'],
    ]],
    ['energy', 'Work and energy', 'Energy', [
      ['workConst', 'Work by a constant force', 'c', 1, 'work done|how much work|joules'],
      ['workVar', 'Work by a variable force', 'm', 1, 'spring|stretch|compress|variable force|f(x)|hooke'],
      ['workEnergy', 'Work–energy theorem', 'c', 1, 'work–energy|work-energy|kinetic energy|net work'],
      ['conservation', 'Conservation of mechanical energy', 'c', 1, 'conservation of energy|potential energy|mechanical energy|roller coaster|frictionless hill'],
      ['friction', 'Energy with friction', 'c', 1, 'thermal energy|energy lost|dissipated|non-conservative'],
      ['power', 'Power', 'm', 0, 'power|watt|kw|horsepower'],
    ]],
    ['mom', 'Momentum and systems', 'Momentum', [
      ['impulse', 'Impulse and average force', 'c', 1, 'impulse|average force|contact|n·s|bounces'],
      ['conservation', 'Conservation of momentum and recoil', 'c', 1, 'momentum|recoil|push apart|cannon|explodes'],
      ['inelastic', 'Perfectly inelastic collisions', 'c', 1, 'stick together|sticks|embeds|coupled|perfectly inelastic|ballistic'],
      ['elastic', 'Elastic collisions in one dimension', 'c', 1, 'elastic collision|head-on'],
      ['twoD', 'Collisions in two dimensions', 'm', 1, 'at right angles|glancing|two-dimensional'],
      ['com', 'Center of mass', 'm', 1, 'center of mass|centre of mass'],
      ['rocket', 'Rockets and variable mass', 'o', 0, 'rocket|exhaust|thrust|fuel'],
    ]],
    ['rot', 'Rotation', 'Rotation', [
      ['kinematics', 'Rotational kinematics', 'c', 1, 'angular velocity|angular acceleration|rad/s|rpm|revolutions|spins'],
      ['inertia', 'Moment of inertia', 'c', 1, 'moment of inertia|rotational inertia|parallel-axis|kg·m²'],
      ['torque', 'Torque and angular acceleration', 'c', 1, 'torque|lever arm|wrench|n·m'],
      ['energy', 'Rotational kinetic energy', 'c', 1, 'rotational kinetic|flywheel'],
      ['rolling', 'Rolling without slipping', 'm', 1, 'rolls|rolling|without slipping'],
      ['angMom', 'Angular momentum and its conservation', 'c', 1, 'angular momentum|pulls in her arms|skater|turntable'],
    ]],
    ['statics', 'Static equilibrium', 'Statics', [
      ['beams', 'Beams and supports', 'm', 1, 'equilibrium|beam|support|seesaw|plank|reaction'],
      ['ladders', 'Ladders and hinged booms', 'm', 1, 'ladder|leans|hinged|boom|strut'],
    ]],
    ['grav', 'Gravitation', 'Gravitation', [
      ['law', 'Newton’s law of gravitation', 'm', 0, 'gravitational force|universal gravitation|6.67'],
      ['orbits', 'Orbits: speed, period, Kepler’s third law', 'm', 0, 'orbit|satellite|kepler'],
      ['escape', 'Escape speed and gravitational potential energy', 'm', 0, 'escape speed|escape velocity|gravitational potential energy'],
    ]],
    ['osc', 'Oscillations', 'Oscillations', [
      ['spring', 'Mass–spring oscillator', 'c', 1, 'oscillat|simple harmonic|shm|spring constant'],
      ['pendulum', 'Simple pendulum', 'c', 1, 'pendulum|swings|bob'],
      ['energy', 'Energy in simple harmonic motion', 'm', 1, 'amplitude|maximum speed|total energy'],
      ['physical', 'Physical pendulum', 'o', 0, 'physical pendulum|rod swings|pivot'],
    ]],
    ['fluids', 'Fluids', 'Fluids', [
      ['pressure', 'Pressure with depth', 'o', 0, 'pressure|depth|below the surface|kpa'],
      ['buoyancy', 'Buoyancy', 'o', 0, 'buoyant|buoyancy|floats|submerged|archimedes'],
      ['bernoulli', 'Continuity and Bernoulli’s equation', 'o', 0, 'bernoulli|flow|pipe|continuity|narrows'],
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
];

export const CONCEPTS = new Map<string, Concept>(COURSES.flatMap((c) => c.units.flatMap((u) => u.concepts.map((k) => [k.id, k] as const))));
export const conceptName = (id: string | null | undefined) => (id && CONCEPTS.get(id)?.name) || 'Unknown concept';
/** The short label shown above a question, e.g. "Kinematics". */
export const unitLabel = (conceptId: string) => CONCEPTS.get(conceptId)?.unit.label ?? '';
