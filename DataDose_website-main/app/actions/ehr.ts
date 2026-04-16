"use server";

import prisma from "@/lib/prisma";

/**
 * Fetches the comprehensive EHR profile for a patient mapped to a physician's scan.
 * This guarantees chronic conditions and allergies can be injected into the LLM GraphRAG prompt natively.
 */
export async function getPatientEHR(patientEmail: string) {
  try {
    const ehr = await prisma.patientEHR.findFirst({
      where: {
        user: {
          email: patientEmail,
          role: "PATIENT",
        },
      },
      include: {
        user: true,
      },
    });

    if (!ehr) return null;
    
    return {
      chronicConditions: ehr.chronicConditions || [],
      allergies: ehr.allergies || [],
      priorSurgeries: ehr.priorSurgeries || [],
      dateOfBirth: ehr.dateOfBirth,
      gender: ehr.gender,
      name: ehr.user.name,
    };
  } catch (error) {
    console.error("Critical Error fetching Patient EHR node:", error);
    return null;
  }
}
