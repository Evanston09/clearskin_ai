export type Question = {
  id: number;
  text: string;
  options: Record<string, string>;
  category: string;
};

export const questionData: Question[] = [
    {
      "id": 1,
      "text": "Over the past 2 weeks, how many hours of sleep did you usually get per night?",
      "category": "Sleep",
      "options": {
        "<6": "Less than 6 hours of sleep can make your skin break out more. Try getting closer to 7 or 8 hours so your skin has time to heal!",
        "6–7": "Six to seven hours is okay, but your skin will do even better if you can push it closer to eight hours most nights.",
        "7–8": "Seven to eight hours is great for your skin and helps it repair itself overnight. Keep it up.",
        "8–9": "Eight to nine hours is plenty of rest and your skin will thank you for it.",
        ">9": "More than nine hours is fine, just keep your sleep schedule regular so your skin stays balanced."
      }
    },
    {
      "id": 2,
      "text": "In the past 7 days, how many days were your meals mostly minimally processed (protein + veggies/fruit + whole grains) and low in added sugar?",
      "category": "Nutrition",
      "options": {
        "0–1 days": "Eating mostly processed foods can make breakouts worse. Try adding more whole foods and veggies when you can.",
        "2–3 days": "Your meals could be cleaner. A few more fruits and protein will help your skin over time.",
        "4–5 days": "You're halfway there. Eating balanced meals more often will give your skin better support.",
        "6 days": "Most of your meals are good choices. Keep it up and your skin will benefit even more.",
        "7 days": "Awesome job keeping meals clean and balanced. Your skin is getting the nutrients it needs."
      }
    },
    {
      "id": 3,
      "text": "In the past 7 days, how many days did you have sugary drinks or desserts?",
      "category": "Sugar",
      "options": {
        "0 days": "Great job skipping sugary drinks and desserts. That really helps with breakouts.",
        "1–2 days": "A little sugar now and then is fine. Keeping it low helps your skin stay clear.",
        "3–4 days": "A few sweet days are okay, but cutting back more could calm your breakouts.",
        "5–6 days": "Having sugar most days can trigger breakouts. Try swapping in fruit or water when you can.",
        "7 days": "Sweets every day can make acne worse. Cutting back will give your skin a real boost."
      }
    },
    {
      "id": 4,
      "text": "In the past 7 days, how many days did you exercise for 30+ minutes (enough to raise your heart rate)?",
      "category": "Exercise",
      "options": {
        "0 days": "No exercise makes it harder for your skin to recover. Try adding even a little movement each week.",
        "1–2 days": "A bit of activity is good, but your skin will benefit more if you can move 3 or 4 days a week.",
        "3–4 days": "Nice work getting exercise most of the week. This helps your skin and stress levels.",
        "5–6 days": "Great job staying active. Regular movement supports clearer, healthier skin.",
        "7 days": "Daily exercise is awesome. Just be sure to wash your face after sweating so pores stay clear."
      }
    },
    {
      "id": 5,
      "text": "How often do you change your pillowcases?",
      "category": "Pillowcases",
      "options": {
        "Every 1–2 days": "Changing pillowcases this often is great. It keeps bacteria and oil away from your skin.",
        "Every 3–4 days": "This is a good routine. It helps reduce buildup that can cause breakouts.",
        "Once a week": "Weekly changes are okay, but your skin may do better if you switch pillowcases more often.",
        "Every 2+ weeks": "Waiting this long lets bacteria and oil build up. Try changing them more often to help with breakouts."
      }
    },
    {
      "id": 6,
      "text": "How often do you change your bed sheets?",
      "category": "Sheets",
      "options": {
        "Once a week": "Changing your sheets weekly is perfect. It helps keep your skin clear.",
        "Every 2 weeks": "Every two weeks is okay, but your skin might improve if you wash them more often.",
        "Once a month": "Monthly changes let dirt and oil build up. Try washing your sheets more often to help prevent breakouts.",
        "Less than once a month": "Not washing sheets often can contribute to acne. Aim for at least once a week for healthier skin."
      }
    },
    {
      "id": 7,
      "text": "Which skincare products do you use at least 3 times per week?",
      "category": "Skincare",
      "options": {
        "None": "Using nothing might feel simple, but even a gentle cleanser and lightweight moisturizer can make a big difference for your skin.",
        "Gentle cleanser only": "Great start with a cleanser. Adding a light moisturizer can help balance your skin and prevent breakouts.",
        "Moisturizer only": "Moisturizing is good, but your skin also needs a gentle cleanser to remove oil and dirt.",
        "Sunscreen only": "Sunscreen is important, but pairing it with a cleanser and moisturizer helps keep your skin clear.",
        "Cleanser + moisturizer": "Nice routine! Keeping it simple with these basics is perfect for oily, breakout-prone skin.",
        "Cleanser + moisturizer + sunscreen": "Excellent! This covers the essentials for protecting and balancing your skin.",
        "Active ingredients (retinoids, acids, etc.)": "These can help acne, but start slow and see how your skin reacts."
      }
    },
    {
      "id": 8,
      "text": "Over the past 2 weeks, how would you rate your stress level?",
      "category": "Stress",
      "options": {
        "1 (Very low)": "Low stress is great for your skin. Keep up whatever is helping you stay calm.",
        "2 (Low)": "A little stress now and then is normal. Try to take small breaks or breathe deeply to keep your skin happy.",
        "3 (Moderate)": "Moderate stress can show up on your skin. Short relaxing habits can really help.",
        "4 (High)": "High stress may trigger breakouts. Try taking time to unwind and focus on self-care.",
        "5 (Very high)": "Frequent stress can make breakouts worse. Even small calming routines each day can help your skin and mood."
      }
    },
    {
      "id": 9,
      "text": "How often do you exfoliate your skin (scrubs, acids, peels, etc.)?",
      "category": "Exfoliation",
      "options": {
        "2–3 times a week": "This is a great routine, not too much or too little, and perfect for keeping skin clear.",
        "Once a week": "Once a week works well. Your skin can handle a bit more if needed, but don't overdo it.",
        "Rarely or never": "Exfoliating 1–2 times a week can help keep pores clear and reduce breakouts.",
        "Daily": "Daily exfoliation can irritate your skin and make breakouts worse. Try cutting back to 2–3 times a week."
      }
    },
    {
      "id": 10,
      "text": "On a typical day, how often do you touch your face?",
      "category": "Habits",
      "options": {
        "Rarely": "Great job! Keeping your hands off your face really helps prevent breakouts.",
        "Occasionally": "Not bad, but try to touch your face even less to keep your skin clearer.",
        "Frequently": "Frequent touching can spread bacteria and cause breakouts. Try to be more mindful.",
        "Constantly": "Constant face touching can make acne worse. Finding ways to keep your hands away will help your skin."
      }
    },
    {
      "id": 11,
      "text": "Do you share makeup or skincare products with others?",
      "category": "Makeup",
      "options": {
        "Never": "Perfect! Not sharing products keeps bacteria away and helps prevent breakouts.",
        "Sometimes": "Sharing products can spread bacteria and trigger acne. Try to avoid it when you can.",
        "Often": "Sharing products often can make breakouts worse. It's best to use only your own items.",
        "I don't use makeup or skincare": "Not using makeup avoids extra bacteria and stress on your skin — that's great for keeping it clear."
      }
    }
  ]
