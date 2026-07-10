import { prisma, Role } from "./index.js";

async function seed() {
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
            description:
                "Learn the fundamentals of software testing with ISTQB-aligned content.",
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
            rawText:
                "Test levels correspond to phases of development. Each level has specific objectives and techniques.",
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

    console.log("Seeding complete.");
    console.log({ admin: admin.id, instructor: instructor.id, student: student.id, course: course.id });
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
