import Groq from "groq-sdk";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
const client = apiKey ? new Groq({ apiKey }) : null;

/**
 * 📚 Génération de la liste de Quiz
 */
export async function generateQuizList(count: number = 2) {
  if (!client) throw new Error("GROQ_API_KEY not configured");

  const prompt = `Génère une liste de ${count} sujets de quiz IT professionnels différents (ex: React, Docker, SQL). 
  Chaque sujet doit cibler une technologie spécifique.
  
  IMPORTANT: RÉPONDS UNIQUEMENT PAR UN TABLEAU JSON VALIDE. PAS DE TEXTE AVANT OU APRÈS.
  
  Format JSON attendu:
  [
    {
      "title": "Titre du Quiz",
      "category": "Frontend|Backend|DevOps|Database|Mobile|Cloud|Cybersecurity",
      "description": "Brève description technique",
      "difficulty": "beginner|intermediate|advanced|expert",
      "icon": "code|storage|cloud|security|terminal|settings|layers",
      "color": "#HEX_COLOR"
    }
  ]`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0].message.content || "";

    // Groq with json_object might return an object instead of an array depending on prompt
    // We try to find the array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Si c'est un objet qui contient le tableau
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      const keys = Object.keys(parsed);
      if (Array.isArray(parsed[keys[0]])) return parsed[keys[0]];
      throw new Error("Impossible d'extraire le tableau JSON");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("❌ generateQuizList failed:", error);
    throw error;
  }
}

/**
 * ❓ Génération des questions (Utilise maintenant Groq)
 */
export async function generateQuestionsWithGemini(category: string, difficulty: string, count: number = 5) {
  if (!client) throw new Error("GROQ_API_KEY not configured");

  const prompt = `Génère ${count} questions de quiz techniques sur ${category} pour un niveau ${difficulty}.
  
  IMPORTANT: RÉPONDS UNIQUEMENT PAR UN TABLEAU JSON VALIDE. PAS DE TEXTE AVANT OU APRÈS.
  
  Format JSON attendu:
  [
    {
      "question": "Texte de la question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explication technique détaillée de la réponse"
    }
  ]`;

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0].message.content || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let questionsData;
    if (jsonMatch) {
      questionsData = JSON.parse(jsonMatch[0]);
    } else {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) questionsData = parsed;
      else {
        const keys = Object.keys(parsed);
        questionsData = parsed[keys[0]];
      }
    }

    if (!Array.isArray(questionsData)) {
      throw new Error("L'IA n'a pas renvoyé un tableau de questions");
    }

    return questionsData.map((q: any) => ({
      id: crypto.randomUUID(),
      ...q,
      isAiGenerated: true,
    }));
  } catch (error) {
    console.error("❌ generateQuestions failed:", error);
    throw error;
  }
}