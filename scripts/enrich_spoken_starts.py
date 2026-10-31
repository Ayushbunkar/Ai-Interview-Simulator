import json
import re

def enrich_spoken_starts(bank_path):
    with open(bank_path, 'r', encoding='utf-8') as f:
        bank = json.load(f)
    
    updated_count = 0
    for q in bank:
        current = q.get('sampleSpokenStart', '')
        if current.startswith('To answer this directly,'):
            q_text = q['question'].strip()
            # Clean and generate natural spoken starter
            q_clean = q_text.rstrip('?').strip()
            
            if re.match(r'^what is the difference between', q_clean, re.I):
                topic = re.sub(r'^what is the difference between\s+', '', q_clean, flags=re.I)
                starter = f"The fundamental distinction between {topic} comes down to their internal architecture and usage: "
            elif re.match(r'^difference between', q_clean, re.I):
                topic = re.sub(r'^difference between\s+', '', q_clean, flags=re.I)
                starter = f"When comparing {topic}, the critical trade-off lies in how each handles state and memory: "
            elif re.match(r'^how does .* work internally', q_clean, re.I):
                topic = re.sub(r'^how does\s+', '', q_clean, flags=re.I)
                starter = f"Under the hood, {topic} through a multi-step execution cycle: "
            elif re.match(r'^why is|why does|why do', q_clean, re.I):
                topic = re.sub(r'^why (is|does|do)\s+', '', q_clean, flags=re.I)
                starter = f"The core engineering reason why {topic} is that "
            elif re.match(r'^what is|what are', q_clean, re.I):
                topic = re.sub(r'^what (is|are)\s+', '', q_clean, flags=re.I)
                starter = f"In modern software engineering, {topic} is defined as "
            elif re.match(r'^can a|can constructors|does java|is it possible', q_clean, re.I):
                starter = f"Regarding {q_clean.lower()}, the definitive answer is grounded in language specifications: "
            elif re.match(r'^explain', q_clean, re.I):
                topic = re.sub(r'^explain\s+', '', q_clean, flags=re.I)
                starter = f"To explain {topic} clearly, we need to examine its underlying mechanics: "
            else:
                starter = f"When an interviewer asks about {q_clean.lower()}, I structure my response around: "
            
            q['sampleSpokenStart'] = starter
            updated_count += 1
            
    with open(bank_path, 'w', encoding='utf-8') as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)
    print(f"Updated {updated_count} sample spoken starts in {bank_path}")

if __name__ == '__main__':
    enrich_spoken_starts('lib/data/question-bank-700.json')
