import type { QuestionType } from "./index.js";
import { prisma, Role } from "./index.js";

process.on("unhandledRejection", reason => {
	console.error("Full error:", JSON.stringify(reason, null, 2));
});

interface SlideSeed {
	index: number;
	title: string;
	rawText: string;
}

interface QuizQuestionSeed {
	index: number;
	questionText: string;
	type: QuestionType;
	options: string[];
	correctAnswer: string;
	explanation: string;
}

interface ProductCourseSeed {
	id: string;
	title: string;
	description: string;
	slides: SlideSeed[];
	questions: QuizQuestionSeed[];
}

/**
 * Seeds a course (with slides, a curated quiz, and a student enrollment) for one of
 * Cerios' product solutions. Quiz questions are hand-authored here (not generated via
 * apps/api-elearning's auto-generator) so the seed script stays self-contained and
 * doesn't depend on application code.
 */
async function seedProductCourse(data: ProductCourseSeed, instructorId: string, studentId: string): Promise<string> {
	const course = await prisma.course.upsert({
		where: { id: data.id },
		update: {},
		create: {
			id: data.id,
			title: data.title,
			description: data.description,
			published: true,
			instructorId,
		},
	});

	for (const slide of data.slides) {
		await prisma.slide.upsert({
			where: { courseId_index: { courseId: course.id, index: slide.index } },
			update: {},
			create: { ...slide, courseId: course.id },
		});
	}

	const quiz = await prisma.quiz.upsert({
		where: { courseId: course.id },
		update: {},
		create: { id: `${data.id}-quiz`, courseId: course.id },
	});

	for (const question of data.questions) {
		await prisma.quizQuestion.upsert({
			where: { id: `${data.id}-quiz-q${question.index}` },
			update: {},
			create: { id: `${data.id}-quiz-q${question.index}`, quizId: quiz.id, ...question },
		});
	}

	await prisma.enrollment.upsert({
		where: { userId_courseId: { userId: studentId, courseId: course.id } },
		update: {},
		create: { userId: studentId, courseId: course.id },
	});

	return course.id;
}

async function seed(): Promise<void> {
	console.log("Seeding database...");

	// Seed users (in production these come from Keycloak; this is for local dev)
	const admin = await prisma.user.upsert({
		where: { email: "admin@cerios.nl" },
		update: {},
		create: {
			keycloakId: "admin-keycloak-id",
			email: "admin@cerios.nl",
			firstName: "Admin",
			lastName: "User",
			role: Role.ADMIN,
		},
	});

	const instructor = await prisma.user.upsert({
		where: { email: "instructor@cerios.nl" },
		update: {},
		create: {
			keycloakId: "instructor-keycloak-id",
			email: "instructor@cerios.nl",
			firstName: "Instructor",
			lastName: "User",
			role: Role.INSTRUCTOR,
		},
	});

	const student = await prisma.user.upsert({
		where: { email: "student@cerios.nl" },
		update: {},
		create: {
			keycloakId: "student-keycloak-id",
			email: "student@cerios.nl",
			firstName: "Student",
			lastName: "User",
			role: Role.STUDENT,
		},
	});

	// Seed a sample course
	const course = await prisma.course.upsert({
		where: { id: "seed-course-1" },
		update: {},
		create: {
			id: "seed-course-1",
			title: "Introduction to Software Testing",
			description: "Learn the fundamentals of software testing with ISTQB-aligned content.",
			published: true,
			instructorId: instructor.id,
		},
	});

	// Seed sample slides
	const slideData = [
		{
			index: 0,
			title: "What is Software Testing?",
			rawText:
				"Software testing is the process of evaluating a system to find defects. Testing ensures quality and correctness.",
		},
		{
			index: 1,
			title: "Types of Testing",
			rawText:
				"There are many types of testing: unit testing, integration testing, system testing, and acceptance testing.",
		},
		{
			index: 2,
			title: "Test Levels",
			rawText: "Test levels correspond to phases of development. Each level has specific objectives and techniques.",
		},
	];

	for (const slide of slideData) {
		await prisma.slide.upsert({
			where: { courseId_index: { courseId: course.id, index: slide.index } },
			update: {},
			create: { ...slide, courseId: course.id },
		});
	}

	// Seed enrollment
	await prisma.enrollment.upsert({
		where: { userId_courseId: { userId: student.id, courseId: course.id } },
		update: {},
		create: { userId: student.id, courseId: course.id },
	});

	// Seed Cerios product courses (JOSF, Omnext, TestMonitor, Supportbook), each with
	// slides + a curated quiz, based on the public product info at cerios.com/nl/solutions.
	const josfCourse = await seedProductCourse(
		{
			id: "seed-course-josf",
			title: "JOSF: Low-Code Test Automation",
			description: "Learn how JOSF brings visual, low-code test automation to OutSystems, Mendix and PEGA.",
			slides: [
				{
					index: 0,
					title: "What is JOSF?",
					rawText:
						"JOSF is a low-code test automation platform, live since 2022. It replaces complex code with a visual, " +
						"intuitive approach, letting teams build their first automated test within 15 minutes.",
				},
				{
					index: 1,
					title: "Test Coverage",
					rawText:
						"JOSF supports five kinds of testing: UI testing, API testing, browser testing, network testing and " +
						"database testing. It also supports accessibility testing so every release can be checked for full coverage.",
				},
				{
					index: 2,
					title: "Built for Low-Code",
					rawText:
						"JOSF focuses entirely on low-code platforms: OutSystems, Mendix and PEGA. For OutSystems it uses a Core " +
						"Layer Testing (CLT) approach, testing business logic from the user's perspective but with the speed and " +
						"stability of the platform APIs. For Mendix, JOSF understands how apps are structured to quickly create " +
						"reusable UI test components.",
				},
				{
					index: 3,
					title: "Automate and Maintain Tests",
					rawText:
						"Teams compose test cases quickly with drag and drop, structure them with clear step and group " +
						"descriptions, and use JOSF's debug mode to walk through tests step by step. Reusable components mean " +
						"common test steps only need to be built once, and data-driven test sheets add variations without extra work.",
				},
				{
					index: 4,
					title: "Run Anywhere, Integrate Everywhere",
					rawText:
						"Tests can run on any environment, from development to acceptance to production, and across browsers like " +
						"Chrome, Firefox and Edge. Passwords used in tests are protected with JOSF Secrets. Git integration and a " +
						"CLI let teams run tests in CI/CD pipelines such as Azure DevOps, GitLab, GitHub, or on-premise setups.",
				},
			],
			questions: [
				{
					index: 0,
					questionText: "In which year did JOSF become available to organizations?",
					type: "MULTIPLE_CHOICE",
					options: ["2018", "2020", "2022", "2024"],
					correctAnswer: "2022",
					explanation: "JOSF has been helping organizations automate testing since 2022.",
				},
				{
					index: 1,
					questionText: "How many kinds of tests does JOSF support, including accessibility testing?",
					type: "MULTIPLE_CHOICE",
					options: ["3", "4", "5", "6"],
					correctAnswer: "5",
					explanation: "UI, API, browser, network and database testing, plus accessibility testing.",
				},
				{
					index: 2,
					questionText: "JOSF's Core Layer Testing (CLT) approach is designed specifically for OutSystems.",
					type: "TRUE_FALSE",
					options: ["True", "False"],
					correctAnswer: "True",
					explanation: "CLT tests OutSystems business logic via the platform's APIs for speed and stability.",
				},
				{
					index: 3,
					questionText: "What lets JOSF teams avoid rebuilding common test steps for every test case?",
					type: "MULTIPLE_CHOICE",
					options: ["Reusable components", "Manual copy-pasting", "Random test generation", "Screenshots"],
					correctAnswer: "Reusable components",
					explanation: "Reusable components only need to be built once and can be shared across test cases.",
				},
				{
					index: 4,
					questionText: "What does JOSF use to keep passwords safe inside a test?",
					type: "MULTIPLE_CHOICE",
					options: ["JOSF Secrets", "Plain text variables", "Browser cache", "Environment screenshots"],
					correctAnswer: "JOSF Secrets",
					explanation: "JOSF Secrets protect credentials used within automated tests.",
				},
			],
		},
		instructor.id,
		student.id
	);

	const omnextCourse = await seedProductCourse(
		{
			id: "seed-course-omnext",
			title: "Omnext: Software Quality Analysis for Mendix & Boomi",
			description: "Learn how Omnext makes software quality measurable, automated and transparent for Mendix and Boomi.",
			slides: [
				{
					index: 0,
					title: "What is Omnext?",
					rawText:
						"Omnext was founded in 2012 to make software quality measurable in a structured, automated way instead of " +
						"through manual code review. Its Software Quality Analysis (SQA) platform helps organizations take back " +
						"control of their application landscape.",
				},
				{
					index: 1,
					title: "Scale and Trust",
					rawText:
						"Omnext is used by more than 150 customers, ranging from startups to multinationals, for their most " +
						"critical applications. The platform scans more than 1000 applications, and Omnext is the market leader " +
						"for quality analysis on both Mendix and Boomi.",
				},
				{
					index: 2,
					title: "How It Measures Quality",
					rawText:
						"Omnext runs fully automated code analyses, scoring software against ISO-25010 criteria and sector " +
						"standards. This produces clear scores and recommendations without subjective, manual review, saving " +
						"valuable time in the QA process.",
				},
				{
					index: 3,
					title: "Dashboard and CI/CD",
					rawText:
						"An overview dashboard lets teams manage quality risks at portfolio or application level, with detailed " +
						"reports to monitor progress. Omnext integrates directly into CI/CD pipelines, so every build gets " +
						"automatic analysis and immediate feedback.",
				},
			],
			questions: [
				{
					index: 0,
					questionText: "In which year was Omnext founded?",
					type: "MULTIPLE_CHOICE",
					options: ["2008", "2012", "2016", "2020"],
					correctAnswer: "2012",
					explanation: "Omnext was founded in 2012 to make software quality measurable and automated.",
				},
				{
					index: 1,
					questionText: "Omnext is described as the market leader for quality analysis on which two platforms?",
					type: "MULTIPLE_CHOICE",
					options: ["Mendix & Boomi", "OutSystems & PEGA", "Java & .NET", "SAP & Salesforce"],
					correctAnswer: "Mendix & Boomi",
					explanation: "Omnext is the market leader for Mendix and Boomi quality analysis.",
				},
				{
					index: 2,
					questionText: "Omnext measures software quality mainly through manual code reviews performed by consultants.",
					type: "TRUE_FALSE",
					options: ["True", "False"],
					correctAnswer: "False",
					explanation: "Omnext replaces manual code review with fully automated, objective analysis.",
				},
				{
					index: 3,
					questionText: "Which international standard does Omnext use as a basis for its quality analysis?",
					type: "MULTIPLE_CHOICE",
					options: ["ISO-25010", "ISO-9001", "ISO-27001", "GDPR"],
					correctAnswer: "ISO-25010",
					explanation: "Omnext analyzes software against ISO-25010 criteria and sector standards.",
				},
			],
		},
		instructor.id,
		student.id
	);

	const testMonitorCourse = await seedProductCourse(
		{
			id: "seed-course-testmonitor",
			title: "TestMonitor: All-in-One Test Management",
			description: "Learn how TestMonitor brings requirements, test design, test runs and incident management together.",
			slides: [
				{
					index: 0,
					title: "What is TestMonitor?",
					rawText:
						"TestMonitor is a user-friendly, intuitive platform for manual test management. It's used when developing " +
						"new software, implementing complex IT, or testing new releases and updates.",
				},
				{
					index: 1,
					title: "History",
					rawText:
						"TestMonitor started in 2018 as a spin-off of the test management consultancy CEPO, built on the mission " +
						"of letting everyone test easily. In August 2024, TestMonitor became part of Cerios, strengthening its " +
						"leading position in software quality and test management.",
				},
				{
					index: 2,
					title: "Scale",
					rawText:
						"TestMonitor serves more than 350 customers across small, large and highly complex test projects, and is " +
						"active in more than 30 countries, with the largest markets being the United States, Canada, the United " +
						"Kingdom, Australia, the Netherlands, Germany and Belgium.",
				},
				{
					index: 3,
					title: "All-in-One Workflow",
					rawText:
						"TestMonitor bundles every part of the test process, from requirements to test design, test runs and " +
						"integrated incident management, in one central environment, replacing scattered tools and spreadsheets.",
				},
				{
					index: 4,
					title: "Flexible and Integrated",
					rawText:
						"The platform can be customized with its own fields, roles and filters, and integrates with tools like " +
						"Jira, Azure DevOps, Selenium and Playwright. TestMonitor is intuitive enough that teams can get started " +
						"without any training.",
				},
			],
			questions: [
				{
					index: 0,
					questionText: "In which year was TestMonitor originally founded?",
					type: "MULTIPLE_CHOICE",
					options: ["2015", "2018", "2020", "2024"],
					correctAnswer: "2018",
					explanation: "TestMonitor started in 2018 as a spin-off of CEPO.",
				},
				{
					index: 1,
					questionText: "TestMonitor was originally a spin-off of which consultancy?",
					type: "MULTIPLE_CHOICE",
					options: ["CEPO", "Cerios", "Omnext", "Chipsoft"],
					correctAnswer: "CEPO",
					explanation: "TestMonitor began as a spin-off of the test management consultancy CEPO.",
				},
				{
					index: 2,
					questionText: "In which year did TestMonitor become part of Cerios?",
					type: "MULTIPLE_CHOICE",
					options: ["2020", "2022", "2023", "2024"],
					correctAnswer: "2024",
					explanation: "TestMonitor joined Cerios in August 2024.",
				},
				{
					index: 3,
					questionText: "TestMonitor only supports test runs and cannot manage requirements or incidents.",
					type: "TRUE_FALSE",
					options: ["True", "False"],
					correctAnswer: "False",
					explanation: "TestMonitor bundles requirements, test design, test runs and incident management together.",
				},
				{
					index: 4,
					questionText: "Which of these tools does TestMonitor integrate with?",
					type: "MULTIPLE_CHOICE",
					options: ["Jira", "Photoshop", "AutoCAD", "Excel Macros"],
					correctAnswer: "Jira",
					explanation: "TestMonitor integrates with tools like Jira, Azure DevOps, Selenium and Playwright.",
				},
			],
		},
		instructor.id,
		student.id
	);

	const supportbookCourse = await seedProductCourse(
		{
			id: "seed-course-supportbook",
			title: "Supportbook: Test Management for Healthcare",
			description: "Learn how Supportbook helps healthcare organizations test software updates and releases safely.",
			slides: [
				{
					index: 0,
					title: "What is Supportbook?",
					rawText:
						"Supportbook is a test management platform built specifically for the healthcare sector, from hospitals " +
						"to GGDs, home care and VVT organizations. It helps them structure testing around software " +
						"implementations, updates and releases.",
				},
				{
					index: 1,
					title: "History and Scale",
					rawText:
						"Supportbook launched in 2013 and is now used by more than 70 healthcare organizations in the " +
						"Netherlands, Belgium and Curaçao, with over 10,000 users who have together run more than 2 million tests.",
				},
				{
					index: 2,
					title: "Structured Release Testing",
					rawText:
						"Supportbook centralizes the full test process around software updates, from preparation to evaluation " +
						"and reporting. Everything stays traceable, so it's ready for audits and quality checks.",
				},
				{
					index: 3,
					title: "Integration with the TestBot",
					rawText:
						"Supportbook combines manual testing with the TestBot, which runs automated tests on HiX, the electronic " +
						"health record system from Chipsoft. Together they give one environment for testing every software change.",
				},
				{
					index: 4,
					title: "Release Notes, Reuse and Community",
					rawText:
						"Thanks to integration with standardized healthcare applications, release notes and reusable test " +
						"scripts become available automatically, saving time and preventing mistakes. Users also share results " +
						"and scenarios in an active community. Beyond healthcare software, Supportbook is also used for projects " +
						"like Windows migrations and SharePoint implementations, and can be operational within a single day.",
				},
			],
			questions: [
				{
					index: 0,
					questionText: "In which year did Supportbook launch?",
					type: "MULTIPLE_CHOICE",
					options: ["2010", "2013", "2016", "2020"],
					correctAnswer: "2013",
					explanation: "Supportbook launched in 2013 to help healthcare organizations test software changes.",
				},
				{
					index: 1,
					questionText: "Roughly how many tests have been run through Supportbook?",
					type: "MULTIPLE_CHOICE",
					options: ["200,000+", "2 million+", "20 million+", "2 billion+"],
					correctAnswer: "2 million+",
					explanation: "Supportbook has passed the mark of 2 million tests run.",
				},
				{
					index: 2,
					questionText: "Which electronic health record (EPD) system does the TestBot run automated tests on?",
					type: "MULTIPLE_CHOICE",
					options: ["HiX", "Epic", "ChipSoft Basic", "MEDITECH"],
					correctAnswer: "HiX",
					explanation: "The TestBot automates tests on HiX, Chipsoft's electronic health record system.",
				},
				{
					index: 3,
					questionText: "Supportbook can only be used for healthcare software and not for other IT projects.",
					type: "TRUE_FALSE",
					options: ["True", "False"],
					correctAnswer: "False",
					explanation: "Supportbook is also used for projects like Windows migrations and SharePoint rollouts.",
				},
				{
					index: 4,
					questionText: "About how long does it take a team to get Supportbook operational?",
					type: "MULTIPLE_CHOICE",
					options: ["1 day", "1 week", "1 month", "6 months"],
					correctAnswer: "1 day",
					explanation: "Supportbook is user-friendly and quick to implement, ready within a single day.",
				},
			],
		},
		instructor.id,
		student.id
	);

	console.log("Seeding complete.");
	console.log({
		admin: admin.id,
		instructor: instructor.id,
		student: student.id,
		course: course.id,
		josfCourse,
		omnextCourse,
		testMonitorCourse,
		supportbookCourse,
	});
}

async function main(): Promise<void> {
	try {
		await seed();
	} catch (e) {
		console.error(e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

void main();
