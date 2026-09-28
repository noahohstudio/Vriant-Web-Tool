# Vriant — curriculum map

> Research for the problem bank (plan step 1). Status: **draft for review**. Compiled 27 Sep 2026.
>
> This decides which concepts the bank covers, in what order we build them, and how common each concept is. Every bank problem will be **original**: sources tell us *what* to cover and *how hard*, never the wording of a problem.

## How courses were chosen

1. **Cooper Union first (the target audience).** Every Cooper engineering student takes the same maths and physics core, set out in each major's degree plan in the 2025–26 catalog. Architecture students take their own maths and physics sequence (below).
2. **Then how popular a course is nationally.**
   - Calculus I–III: about 124,000 students in fall 2021 (mainstream calculus at four-year colleges).
   - Introductory statistics: about 257,000.
   - Calculus-based intro physics: about 180,000 students. Algebra-based: about 160,000.
3. **How common each concept is** comes from surveying syllabi and frameworks, one survey per course:
   - Physics I: 12 sources (Cooper, eight other institutions, and three national references).
   - Calculus I: 10 sources.
   - Other courses: Cooper plus the national frameworks.

**How common:**
- **Core:** in nearly every source.
- **Common:** in about half.
- **Occasional:** in a few.

**Cooper ✓:** named in the Cooper course description.

### Cooper Union core (Albert Nerken School of Engineering)

| Year | Course | Credits | What it covers |
|---|---|---|---|
| 1, fall | Ma 110 Introduction to Linear Algebra | 2 | Vectors, dot and cross products, lines/planes/spheres, matrices, systems, determinants, inverses, complex numbers |
| 1, fall | Ma 111 Calculus I | 4 | Limits, derivatives and applications (curve sketching, extrema, related rates, 1-D motion), trig/exp/log/**hyperbolic** functions, integrals, FTC, **techniques of integration** |
| 1, spring | Ma 113 Calculus II | 4 | Integral applications (area, volume, improper, **work**, arc length, surface area, **centroid**), polar, parametric curves in 2-D/3-D, **partial derivatives, gradient, extrema**, sequences and series |
| 1, spring | Ph 112 Physics I: Mechanics | 4 | **Static equilibrium**, kinematics, Newton's laws, **non-inertial frames**, systems of particles, work–energy, momentum, rigid bodies, oscillation |
| 2, fall | Ma 223 Vector Calculus *(Ma 225, 3 cr, in newer plans)* | 2 | Double/triple integrals, vector fields, grad/div/curl, line integrals, Green's theorem, path independence |
| 2, fall | Ma 240 Differential Equations | 3 | First-order ODEs, constant-coefficient linear ODEs, eigenvalues, linear systems, phase plane, **Laplace**, **Fourier series** |
| 2, fall | Ph 213 Physics II: Electromagnetic Phenomena | 4 | **Oscillations and waves**, fields and Gauss, potential and capacitance, DC circuits, magnetism and Faraday, inductance, **AC circuits**, EM waves |
| 2, spring | Ph 214 Physics III: Optics and Modern Physics | 3 | Geometric and physical optics, electric/magnetic properties of matter, quantum theory of light and of matter, atomic structure |
| 2–3 | Ma 224.1 Probability and Statistics *(replaces Ma 224; Ma 226 in newer plans)* | 3 | Probability, random variables, distributions, expectation, **generating functions**, CLT, estimation, confidence intervals, tests, chi-square, **ANOVA** |

**Also relevant at Cooper:**
- ME 103 Statics and ESC 201 Mechanics of Materials (engineering).
- **Architecture:**
  - Arch 103 Calculus and Analytic Geometry: calculus of one and two variables.
  - Ph 165–166 Concepts of Physics: statics and dynamics.
  - Structures I–IV. Structures II applies strength of materials to wood and steel.

## Build order (waves)

| Wave | Courses | Why |
|---|---|---|
| **1** | Physics I · Calculus I · Calculus II · Intro Linear Algebra | Cooper's whole first year; Physics I and Calculus I are also the biggest calculus-level courses nationally |
| **2** | Physics II · Probability and Statistics · Differential Equations · Vector Calculus | Cooper's second year; statistics has the largest enrollment in the country |
| **3** | Physics III · Statics and Strength of Materials · Precalculus and College Algebra | The rest of Cooper's core, the architecture structures sequence, and the national gateway courses |

About **210 concepts** in total. For template counts: about 3 per Core concept, 2 per Common one, and 1–2 per Occasional one.

Answers are numbers wherever possible. A few concepts are naturally "which one?" questions, such as the direction of an induced current, or whether a series converges. They're marked **(text choice)**. They need a small engine addition: multiple choice with worded options instead of numbers.

---

## Wave 1

### Physics I — Mechanics (Cooper Ph 112)

| Unit | Concept | How common | Cooper |
|---|---|---|---|
| Measurement and vectors | Unit conversion and dimensional analysis | Common | |
| | Vector components, magnitude and direction | Common | |
| Motion in one dimension | Constant-acceleration motion | Core | ✓ |
| | Free fall | Core | ✓ |
| | Motion graphs: slopes and areas | Common | ✓ |
| | Position, velocity and acceleration with calculus | Common | ✓ |
| Motion in two dimensions | Projectile motion | Core | ✓ |
| | Relative velocity | Common | ✓ |
| | Uniform circular motion (centripetal acceleration) | Core | ✓ |
| Newton's laws | Net force and acceleration | Core | ✓ |
| | Inclined planes | Core | ✓ |
| | Tension, pulleys and connected objects | Core | ✓ |
| | Friction, static and kinetic | Core | ✓ |
| | Apparent weight (elevators) | Common | ✓ |
| | Circular-motion dynamics: banked curves, loops, conical pendulum | Core | ✓ |
| | Drag and terminal velocity | Occasional | |
| | Non-inertial frames | Occasional | ✓ |
| Work and energy | Work by a constant force | Core | ✓ |
| | Work by a variable force (springs, integrals) | Common | ✓ |
| | Work–energy theorem | Core | ✓ |
| | Conservation of mechanical energy | Core | ✓ |
| | Energy with friction (non-conservative work) | Core | ✓ |
| | Power | Common | |
| Momentum and systems | Impulse and average force | Core | ✓ |
| | Conservation of momentum and recoil | Core | ✓ |
| | Perfectly inelastic collisions | Core | ✓ |
| | Elastic collisions in one dimension | Core | ✓ |
| | Collisions in two dimensions | Common | ✓ |
| | Center of mass, discrete and continuous | Common | ✓ |
| | Rockets and variable mass | Occasional | |
| Rotation | Rotational kinematics | Core | ✓ |
| | Moment of inertia, parallel-axis theorem | Core | ✓ |
| | Torque and angular acceleration | Core | ✓ |
| | Rotational kinetic energy | Core | ✓ |
| | Rolling without slipping | Common | ✓ |
| | Angular momentum and its conservation | Core | ✓ |
| Static equilibrium | Beams and supports: force and torque balance | Common | ✓ (listed first) |
| | Ladders and hinged booms | Common | ✓ |
| Gravitation | Newton's law of gravitation | Common | |
| | Orbits: speed, period, Kepler's third law | Common | |
| | Escape speed and gravitational potential energy | Common | |
| Oscillations | Mass–spring oscillator | Core | ✓ |
| | Simple pendulum | Core | ✓ |
| | Energy in simple harmonic motion | Common | ✓ |
| | Physical pendulum | Occasional | |
| Fluids | Pressure with depth | Occasional (Common in algebra-based) | |
| | Buoyancy | Occasional | |
| | Continuity and Bernoulli's equation | Occasional | |

The same concepts serve **algebra-based Physics 1**; the calculus-flavoured ones are marked in the bank so they can be left out.

### Calculus I (Cooper Ma 111)

| Unit | Concept | How common | Cooper |
|---|---|---|---|
| Limits and continuity | Evaluating limits algebraically | Core | ✓ |
| | One-sided limits and continuity | Core | ✓ |
| | Limits at infinity and horizontal asymptotes | Core | ✓ |
| | Special trig limits | Common | |
| Derivatives | Derivative from the definition | Core | ✓ |
| | Power, product and quotient rules | Core | ✓ |
| | Chain rule | Core | ✓ |
| | Trigonometric derivatives | Core | ✓ |
| | Exponential and logarithmic derivatives | Core | ✓ |
| | Hyperbolic functions | Occasional | ✓ |
| | Implicit differentiation | Core | |
| | Inverse functions and inverse trig | Common | |
| | Logarithmic differentiation | Common | |
| | Higher-order derivatives | Common | |
| Applications of derivatives | Tangent lines | Core | ✓ |
| | Linear approximation and differentials | Common | |
| | Related rates | Core | ✓ |
| | Motion along a line | Common | ✓ |
| | Critical points and absolute extrema | Core | ✓ |
| | Concavity and inflection points | Core | ✓ |
| | Optimization | Core | ✓ |
| | Mean Value Theorem | Common | |
| | L'Hôpital's rule | Common | |
| | Newton's method | Occasional | |
| Integrals | Antiderivatives and initial-value problems | Core | ✓ |
| | Riemann sums | Common | |
| | Definite integrals and the Fundamental Theorem | Core | ✓ |
| | Derivative of an integral (FTC part 1) | Common | ✓ |
| | Substitution | Core | ✓ |
| | Area under and between curves | Common | ✓ |
| | Average value of a function | Common | |
| | Exponential growth and decay | Common | |

### Calculus II (Cooper Ma 113)

| Unit | Concept | How common | Cooper |
|---|---|---|---|
| Techniques of integration | Integration by parts | Core | ✓ (Ma 111) |
| | Trig integrals and trig substitution | Core | ✓ (Ma 111) |
| | Partial fractions | Core | ✓ (Ma 111) |
| | Numerical integration: trapezoid and Simpson | Common | |
| | Improper integrals | Core | ✓ |
| Applications of integration | Volumes by disks and washers | Core | ✓ |
| | Volumes by cylindrical shells | Core | ✓ |
| | Volumes by cross-sections | Common | ✓ |
| | Arc length | Core | ✓ |
| | Surface area of revolution | Common | ✓ |
| | Work: springs, pumping, cables | Common | ✓ |
| | Centroids and center of mass | Common | ✓ |
| Differential equations | Separable equations | Common | |
| | Logistic growth | Occasional | |
| | Euler's method | Occasional | |
| Parametric and polar | Parametric derivatives and tangent lines | Core | ✓ |
| | Speed and arc length of parametric curves | Common | ✓ |
| | Velocity and acceleration in 2-D and 3-D | Common | ✓ |
| | Polar coordinates and polar area | Core | ✓ |
| Partial derivatives (Cooper; elsewhere Calc III) | Partial derivatives | Cooper | ✓ |
| | Multivariable chain rule | Cooper | ✓ |
| | Gradient and directional derivatives | Cooper | ✓ |
| | Local extrema and the second-derivative test | Cooper | ✓ |
| Sequences and series | Limits of sequences | Core | ✓ |
| | Geometric and telescoping series | Core | ✓ |
| | Convergence tests (text choice) | Core | ✓ |
| | Power series and radius of convergence | Core | ✓ |
| | Taylor and Maclaurin polynomials | Core | ✓ |
| | Taylor error bounds | Common | |

### Introduction to Linear Algebra (Cooper Ma 110)

| Unit | Concept | Cooper |
|---|---|---|
| Vectors | Vector algebra, magnitude and unit vectors | ✓ |
| | Dot product and the angle between vectors | ✓ |
| | Projections | ✓ |
| | Cross product and area | ✓ |
| | Triple product and volume | ✓ |
| Lines, planes and spheres | Lines and planes (plane through three points, normals) | ✓ |
| | Distance from a point to a line or plane | ✓ |
| | Angles between planes; where a line meets a plane | ✓ |
| | Spheres: center and radius | ✓ |
| Matrices and systems | Matrix multiplication | ✓ |
| | Solving linear systems (elimination, Cramer's rule) | ✓ |
| | Determinants, 2×2 and 3×3 | ✓ |
| | Inverse matrices | ✓ |
| Complex numbers | Complex arithmetic and modulus | ✓ |
| | Polar form, powers and roots (De Moivre) | ✓ |

## Wave 2

### Physics II — Electricity and magnetism, with waves (Cooper Ph 213)

| Unit | Concepts |
|---|---|
| Waves and sound | Wave speed, frequency and wavelength · strings and standing waves · sound intensity and decibels · Doppler effect |
| Charge and field | Coulomb's law and superposition · field of point charges · Gauss's law (spheres, lines, planes) · charges in a uniform field |
| Potential | Potential and potential energy of point charges · uniform fields and electron-volts |
| Capacitance | Parallel-plate capacitors · series and parallel · stored energy and dielectrics |
| Current and DC circuits | Resistivity and resistance · Ohm's law and power · series and parallel resistors · Kirchhoff's rules · RC circuits |
| Magnetism | Force on a moving charge · force on wires, torque on loops · fields of wires and solenoids |
| Induction | Faraday's and Lenz's laws (Lenz: text choice) · motional EMF · inductance, LR circuits, stored energy |
| AC and EM waves | Reactance, impedance and resonance · LC oscillation · electromagnetic waves |

### Probability and Statistics (Cooper Ma 224.1; the largest intro course nationally)

| Unit | Concepts |
|---|---|
| Describing data | Mean, median and standard deviation · z-scores and percentiles |
| Probability | Rules and conditional probability · independence · Bayes' theorem · counting (permutations, combinations) |
| Random variables | Expected value and variance · binomial · Poisson and geometric · uniform and exponential · normal probabilities · moment-generating functions |
| Inference | Sampling distributions and the CLT · confidence intervals (means, proportions) · z and t tests · chi-square tests · one-way ANOVA |
| Relationships | Linear regression and correlation |

### Differential Equations (Cooper Ma 240)

- First-order separable and linear equations (integrating factor)
- Cooling, mixing and growth models
- Second-order linear equations with constant coefficients
- Damped and forced oscillators, and resonance
- Eigenvalues and eigenvectors (2×2)
- Linear systems of ODEs
- Phase-plane equilibria (text choice)
- Laplace transforms
- Fourier series coefficients

### Vector Calculus (Cooper Ma 223 / Ma 225)

- Double integrals over rectangles and general regions
- Polar double integrals
- Triple integrals in cylindrical and spherical coordinates
- Mass, center of mass and moments of inertia
- Divergence and curl
- Line integrals (work, circulation)
- Conservative fields and potentials
- Green's theorem
- Flux; Stokes' and divergence theorems (national; possibly in the newer Ma 225)

## Wave 3

- **Physics III — Optics and modern physics (Cooper Ph 214):**
  - Snell's law and the critical angle
  - Thin lenses and mirrors
  - Double slit, gratings, single slit, thin films
  - Polarization
  - Photoelectric effect
  - Compton scattering
  - de Broglie wavelength
  - Bohr model and spectra
  - Special relativity
  - Radioactive decay
- **Statics and strength of materials (Cooper ME 103 and ESC 201; architecture Ph 165–166 and Structures II):**
  - Particle equilibrium and cables
  - Moments and couples
  - Beam reactions (point and distributed loads)
  - Trusses (method of joints)
  - Centroids and area moments of inertia
  - Axial stress and strain
  - Shear and bending-moment values
  - Bending stress
- **Precalculus and College Algebra (the biggest national gateway courses; not Cooper core):**
  - Exponential and log equations
  - Right-triangle trigonometry
  - Law of sines and cosines
  - Trig equations
  - Systems
  - Arithmetic and geometric sequences

---

## Sources

**Cooper Union**
- [Course Catalog 2025–26](https://cooper.edu/sites/default/files/uploads/assets/registrar/CU_Catalog_2025_26.pdf) (degree plans for every engineering major and for architecture)
- Course pages:
  - [Ma 110](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-110)
  - [Ma 111](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-111)
  - [Ma 113](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-113)
  - [Ma 223](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-223)
  - [Ma 224](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-224)
  - [Ma 224.1](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-2241)
  - [Ma 240](https://cooper.edu/engineering/courses/mathematics-undergraduate/ma-240)
  - [Ph 112](https://cooper.edu/engineering/courses/physics-undergraduate/ph-112)
  - [Ph 213](https://cooper.edu/engineering/courses/physics-undergraduate/ph-213)
  - [Ph 214](https://cooper.edu/engineering/courses/physics-undergraduate/ph-214)
  - [Ph 165](https://cooper.edu/engineering/courses/physics-undergraduate/ph-165)
- [Physics department](https://cooper.edu/engineering/departments/physics)
- [Mechanical Engineering curriculum](https://cooper.edu/engineering/departments/mechanical-engineering/curriculum)

**National frameworks**
- College Board:
  - [AP Physics C: Mechanics](https://apstudents.collegeboard.org/courses/ap-physics-c-mechanics)
  - [AP Physics C: E&M](https://apstudents.collegeboard.org/courses/ap-physics-c-electricity-and-magnetism)
  - [AP Physics 1](https://apstudents.collegeboard.org/courses/ap-physics-1)
  - [AP Physics 2](https://apstudents.collegeboard.org/courses/ap-physics-2)
  - [AP Calculus AB](https://apstudents.collegeboard.org/courses/ap-calculus-ab)
  - [AP Calculus BC](https://apstudents.collegeboard.org/courses/ap-calculus-bc)
  - [AP Statistics](https://apstudents.collegeboard.org/courses/ap-statistics)
- California C-ID descriptors:
  - [PHYS 205](https://data-c-idsystem.org/descriptors/final/print/221) (calculus-based mechanics)
  - [MATH 230](http://data-c-idsystem.org/descriptors/final/show/265) (multivariable)
  - MATH 211 (Calculus I), via [c-id.net](https://c-id.net/)
- OpenStax, contents only (all CC BY-NC-SA 4.0; nothing reused):
  - [University Physics Vol. 1](https://openstax.org/books/university-physics-volume-1/pages/preface)
  - [Calculus Vol. 1](https://openstax.org/books/calculus-volume-1/pages/preface)
  - [College Algebra 2e](https://openstax.org/books/college-algebra-2e/pages/preface)
  - [Precalculus 2e](https://openstax.org/books/precalculus-2e/pages/preface)
  - [Introductory Statistics 2e](https://openstax.org/books/introductory-statistics-2e/pages/preface)

**Other institutions' syllabi and course descriptions**
- Physics I:
  - [MIT 8.01](https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/syllabus/)
  - [Georgia Tech PHYS 2211](https://syllabus.gatech.edu/syllabi/2211/a)
  - [UIUC PHYS 211](https://catalog.illinois.edu/courses-of-instruction/phys/)
  - [Ohio State PHYSICS 1250](https://physics.osu.edu/courses/physics-1250)
  - [Penn State PHYS 211](https://bulletins.psu.edu/university-course-descriptions/undergraduate/phys/)
  - [University of Washington PHYS 121](https://phys.washington.edu/121-122-123-courses)
  - [UT Austin PHY 303K](https://catalog.utexas.edu/general-information/coursesatoz/phy/)
  - [Coast Community College District PHYS C185](https://catalog.cccd.edu/courses/phys-c185/)
- Calculus I:
  - [MIT 18.01](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/syllabus/)
  - [Penn State MATH 140](https://sites.psu.edu/altoonamath/mathematics-courses-offered-at-penn-state-altoona/math-140-calculus-with-analytic-geometry-i/)
  - [Michigan MATH 115](https://courses.lsa.umich.edu/math-115/)
  - [Ohio State MATH 1151](https://math.osu.edu/courses/math-1151)
  - [University of Washington MATH 124](https://www.washington.edu/students/crscat/math.html)
  - [UT Austin M 408C](https://catalog.utexas.edu/general-information/coursesatoz/m/)

**Enrollment**
- [CBMS 2021 survey, chapter 1](https://www.ams.org/learning-careers/data/cbms-survey/cbms2021-Chapter1.pdf) (mathematics)
- [AIP Statistical Research Center report](https://files.eric.ed.gov/fulltext/ED594227.pdf) (introductory physics)
