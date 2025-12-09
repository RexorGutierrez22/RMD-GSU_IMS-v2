import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const OurTeam = () => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	const teamMembers = [
		{
			id: 1,
			name: 'Rexor Gutierrez',
			course: 'Bachelor of Science in Information Technology\nmajor in Information Security',
			roles: [
				'Team Tech Leader',
				'Full Stack Developer',
				'Database Administrator',
				'Project Manager'
			],
			color: 'red',
			dotColor: 'bg-red-500',
			initials: 'RG',
			image: '/DEV/GUTIERREZ.png'
		},
		{
			id: 2,
			name: 'John Zedric Acevedo',
			course: 'Bachelor of Science in Information Technology\nmajor in Information Security',
			roles: [
				'Front End Developer',
				'System Analyst',
				'Technical Writer',
				'UI / UX Designer'
			],
			color: 'green',
			dotColor: 'bg-green-500',
			initials: 'JZA',
			image: '/DEV/ACEVEDO.png'
		},
		{
			id: 3,
			name: 'Christian Elle Lacandula',
			course: 'Bachelor of Science in Information Technology\nmajor in Information Security',
			roles: [
				'System Analyst',
				'Technical Writer',
				'UI / UX Designer',
				'Media Editor'
			],
			color: 'yellow',
			dotColor: 'bg-yellow-500',
			initials: 'CEL',
			image: '/DEV/LACANDULA.png'
		}
	];

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.2
			}
		}
	};

	const cardVariants = {
		hidden: {
			opacity: 0,
			y: 50,
			scale: 0.9
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				type: 'spring',
				stiffness: 100,
				damping: 20,
				duration: 0.8
			}
		}
	};

	const titleVariants = {
		hidden: {
			opacity: 0,
			x: -100,
			scale: 0.8
		},
		visible: {
			opacity: 1,
			x: 0,
			scale: 1,
			transition: {
				type: 'spring',
				stiffness: 100,
				duration: 1
			}
		}
	};

	return (
		<div className="h-screen w-full bg-gray-50 relative overflow-hidden">
			{/* Abstract Circular Patterns Background - Red Color Palette */}
			<div className="absolute inset-0 w-full overflow-hidden pointer-events-none">
				{/* Large Translucent Circles */}
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={isVisible ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0 }}
					transition={{ delay: 0.3, duration: 1 }}
					className="absolute -left-32 top-20 w-96 h-96 bg-red-300/30 rounded-full blur-3xl"
				/>
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={isVisible ? { opacity: 0.12, scale: 1 } : { opacity: 0, scale: 0 }}
					transition={{ delay: 0.5, duration: 1 }}
					className="absolute right-1/4 top-10 w-80 h-80 bg-red-400/25 rounded-full blur-2xl"
				/>
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={isVisible ? { opacity: 0.1, scale: 1 } : { opacity: 0, scale: 0 }}
					transition={{ delay: 0.7, duration: 1 }}
					className="absolute left-1/3 bottom-20 w-72 h-72 bg-red-500/20 rounded-full blur-2xl"
				/>

				{/* Semi-Circles and Overlapping Shapes */}
				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={isVisible ? { opacity: 0.2, x: 0 } : { opacity: 0, x: -50 }}
					transition={{ delay: 0.4, duration: 1 }}
					className="absolute left-0 top-1/2 transform -translate-y-1/2 w-64 h-64 bg-red-300/20 rounded-r-full"
				/>
				<motion.div
					initial={{ opacity: 0, x: 50 }}
					animate={isVisible ? { opacity: 0.2, x: 0 } : { opacity: 0, x: 50 }}
					transition={{ delay: 0.6, duration: 1 }}
					className="absolute right-0 top-1/3 w-56 h-56 bg-red-400/20 rounded-l-full"
				/>

				{/* Connecting Circular Patterns */}
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={isVisible ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0 }}
					transition={{ delay: 0.8, duration: 1 }}
					className="absolute left-1/4 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-red-300/30 rounded-full"
				/>
				<motion.div
					initial={{ opacity: 0, scale: 0 }}
					animate={isVisible ? { opacity: 0.15, scale: 1 } : { opacity: 0, scale: 0 }}
					transition={{ delay: 1, duration: 1 }}
					className="absolute right-1/4 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-red-300/30 rounded-full"
				/>

				{/* Small Circular Outlines at Bottom */}
				{[...Array(6)].map((_, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, scale: 0 }}
						animate={isVisible ? { opacity: 0.3, scale: 1 } : { opacity: 0, scale: 0 }}
						transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
						className="absolute bottom-10"
						style={{
							left: `${15 + i * 14}%`,
							width: '20px',
							height: '20px',
							border: '2px solid rgba(220, 38, 38, 0.3)',
							borderRadius: '50%'
						}}
					/>
				))}
			</div>

			<div className="relative z-10 p-4 sm:p-5 md:p-6 h-full flex flex-col w-full">
				<div className="w-full h-full flex flex-col justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
					{/* Title Section */}
					<motion.div
						variants={titleVariants}
						initial="hidden"
						animate={isVisible ? "visible" : "hidden"}
						className="mb-8 md:mb-12 flex-shrink-0 text-center w-full"
					>
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-800 mb-3 tracking-tight">
							<span className="inline-block bg-gradient-to-r from-red-600 via-red-700 to-red-600 bg-clip-text text-transparent">
								Dev Team
							</span>
						</h1>
						<motion.div
							initial={{ width: 0 }}
							animate={isVisible ? { width: '250px' } : { width: 0 }}
							transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
							className="h-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto"
						/>
					</motion.div>

					{/* Team Members Grid */}
					<motion.div
						variants={containerVariants}
						initial="hidden"
						animate={isVisible ? "visible" : "hidden"}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 w-full items-end"
					>
						{teamMembers.map((member, index) => (
							<motion.div
								key={member.id}
								variants={cardVariants}
								whileHover={{
									y: -15,
									scale: 1.02,
									transition: { duration: 0.3 }
								}}
								className="relative group flex flex-col items-center"
							>
								{/* Large Prominent Image - Overlapping */}
								<motion.div
									initial={{ opacity: 0, scale: 0.8, y: 50 }}
									animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 50 }}
									transition={{ delay: 0.4 + index * 0.2, duration: 0.8, type: 'spring', stiffness: 100 }}
									className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 z-20"
									style={{ marginBottom: '-60px' }}
								>
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover shadow-2xl"
										style={{ objectPosition: 'center top' }}
										onError={(e) => {
											e.target.style.display = 'none';
											const fallback = e.target.parentElement.querySelector('.initials-fallback');
											if (fallback) {
												fallback.style.display = 'flex';
											}
										}}
									/>
									<div className="initials-fallback absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 items-center justify-center hidden shadow-2xl">
										<span className="text-5xl md:text-6xl lg:text-7xl font-black text-white">
											{member.initials}
										</span>
									</div>

									{/* Status Dot */}
									<motion.div
										initial={{ scale: 0 }}
										animate={isVisible ? { scale: 1 } : { scale: 0 }}
										transition={{
											delay: 0.6 + index * 0.2,
											type: "spring",
											stiffness: 200
										}}
										className={`absolute -top-2 -right-2 ${member.dotColor} w-6 h-6 rounded-full shadow-lg border-3 border-white z-30`}
									/>

									{/* Scratch/Faded Decorative Line Below Image - Emphasized */}
									<motion.div
										initial={{ opacity: 0, scaleX: 0 }}
										animate={isVisible ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
										transition={{ delay: 0.7 + index * 0.2, duration: 0.8, ease: "easeOut" }}
										className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-40 md:w-48 lg:w-56 z-10"
									>
										<svg width="100%" height="8" className="overflow-visible" viewBox="0 0 200 8">
											<defs>
												<linearGradient id={`fade-main-${member.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="transparent" />
													<stop offset="15%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="0.4" />
													<stop offset="40%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="0.9" />
													<stop offset="60%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="1" />
													<stop offset="85%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="0.4" />
													<stop offset="100%" stopColor="transparent" />
												</linearGradient>
												<linearGradient id={`fade-secondary-${member.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
													<stop offset="0%" stopColor="transparent" />
													<stop offset="30%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="0.5" />
													<stop offset="70%" stopColor={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'} stopOpacity="0.5" />
													<stop offset="100%" stopColor="transparent" />
												</linearGradient>
												<filter id={`glow-${member.id}`}>
													<feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
													<feMerge>
														<feMergeNode in="coloredBlur"/>
														<feMergeNode in="SourceGraphic"/>
													</feMerge>
												</filter>
											</defs>
											{/* Main prominent wavy line */}
											<path
												d={`M 0,4 Q ${40 + index * 8},${-2 + index * 1.5} ${80 + index * 5},4 T ${160 + index * 8},4`}
												stroke={`url(#fade-main-${member.id})`}
												strokeWidth="3.5"
												fill="none"
												strokeLinecap="round"
												filter={`url(#glow-${member.id})`}
											/>
											{/* Secondary scratch lines - more visible */}
											<path
												d={`M ${15 + index * 5},4 Q ${35 + index * 8},${3 - index * 0.8} ${55 + index * 5},4`}
												stroke={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'}
												strokeWidth="2"
												strokeOpacity="0.6"
												fill="none"
												strokeLinecap="round"
											/>
											<path
												d={`M ${145 + index * 5},4 Q ${165 + index * 8},${5 + index * 0.8} ${185 + index * 5},4`}
												stroke={member.color === 'red' ? '#dc2626' : member.color === 'green' ? '#22c55e' : '#eab308'}
												strokeWidth="2"
												strokeOpacity="0.6"
												fill="none"
												strokeLinecap="round"
											/>
											{/* Additional texture lines */}
											<path
												d={`M ${25 + index * 3},5.5 Q ${45 + index * 6},${4.5 - index * 0.5} ${65 + index * 3},5.5`}
												stroke={`url(#fade-secondary-${member.id})`}
												strokeWidth="1.5"
												fill="none"
												strokeLinecap="round"
											/>
											<path
												d={`M ${135 + index * 3},5.5 Q ${155 + index * 6},${5.5 + index * 0.5} ${175 + index * 3},5.5`}
												stroke={`url(#fade-secondary-${member.id})`}
												strokeWidth="1.5"
												fill="none"
												strokeLinecap="round"
											/>
										</svg>
									</motion.div>
								</motion.div>

								{/* Info Card */}
								<motion.div
									initial={{ opacity: 0, y: 30 }}
									animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
									transition={{ delay: 0.6 + index * 0.2, duration: 0.6, ease: 'easeOut' }}
									className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 md:p-6 lg:p-8 w-full pt-20 md:pt-24 lg:pt-28"
								>
									{/* Name */}
									<motion.h3
										initial={{ opacity: 0, y: 20 }}
										animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
										transition={{ delay: 0.8 + index * 0.2, duration: 0.5 }}
										className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 md:mb-3 text-center whitespace-nowrap"
										style={{ lineHeight: '1.2' }}
									>
										{member.name}
									</motion.h3>

									{/* Course */}
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
										transition={{ delay: 0.85 + index * 0.2, duration: 0.5 }}
										className="text-white/80 text-xs md:text-sm lg:text-base text-center mb-4 md:mb-5 leading-tight"
									>
										<div className="whitespace-nowrap">Bachelor of Science in Information Technology</div>
										<div className="text-white/70">major in Information Security</div>
									</motion.div>

									{/* Roles List - Left Aligned */}
									<div className="space-y-2.5 md:space-y-3">
										{member.roles.map((role, roleIndex) => (
											<motion.div
												key={roleIndex}
												initial={{ opacity: 0, x: -20 }}
												animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
												transition={{
													delay: 1 + index * 0.2 + roleIndex * 0.1,
													duration: 0.4
												}}
												className="flex items-center space-x-3"
											>
												<div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
													member.color === 'red' ? 'bg-red-500' :
													member.color === 'green' ? 'bg-green-500' :
													'bg-yellow-500'
												}`} />
												<span className="text-white text-sm md:text-base lg:text-lg font-semibold">
													{role}
												</span>
											</motion.div>
										))}
									</div>
								</motion.div>

								{/* Glow Effect on Hover */}
								<motion.div
									initial={{ opacity: 0 }}
									whileHover={{ opacity: 1 }}
									className={`absolute -inset-4 rounded-3xl blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10 ${
										member.color === 'red' ? 'bg-red-500' :
										member.color === 'green' ? 'bg-green-500' :
										'bg-yellow-500'
									}`}
								/>
							</motion.div>
						))}
					</motion.div>

					{/* Footer Credit */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
						transition={{ delay: 1.5, duration: 0.6 }}
						className="mt-8 md:mt-10 text-center flex-shrink-0 w-full"
					>
						<p className="text-gray-600 text-xs md:text-sm font-medium">
							Built with ❤️ by the RMD IC Intern Developer Team
						</p>
						<p className="text-gray-500 text-xs mt-1">
							Resource Management Division - Resource Inventory Monitoring and Management System
						</p>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default OurTeam;
