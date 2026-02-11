// ============================================
// DATA CONSTANTS
// ============================================

// Big Five Personality Traits
const traits = [
    { id: 'openness', name: 'Openness', subtitle: 'Ide Baru', icon: '🔮', color: 'purple' },
    { id: 'conscientiousness', name: 'Conscientiousness', subtitle: 'Disiplin/Fokus', icon: '🎯', color: 'indigo' },
    { id: 'extraversion', name: 'Extraversion', subtitle: 'Sosial', icon: '🌟', color: 'blue' },
    { id: 'agreeableness', name: 'Agreeableness', subtitle: 'Empati', icon: '💚', color: 'emerald' },
    { id: 'neuroticism', name: 'Neuroticism', subtitle: 'Kecemasan/Stress', icon: '😰', color: 'rose' }
];

// Kutipan Stoic & Hadits
const quotes = [
    // Stoic Quotes
    "Kamu punya kuasa atas pikiranmu—bukan kejadian luar. Sadari ini, dan kamu akan menemukan kekuatan. — Marcus Aurelius",
    "Jangan buang waktu berdebat tentang apa itu pria baik. Jadilah itu. — Marcus Aurelius",
    "Bukan orang yang punya terlalu sedikit yang miskin, tapi orang yang menginginkan lebih. — Seneca",
    "Jika itu tidak benar, jangan lakukan; jika itu tidak jujur, jangan katakan. — Marcus Aurelius",
    "Kita lebih sering menderita dalam imajinasi daripada kenyataan. — Seneca",
    "Berapa lama lagi kamu akan menunggu sebelum menuntut yang terbaik untuk dirimu sendiri? — Epictetus",
    "Jangan jelaskan filosofimu. Wujudkan itu. — Epictetus",
    "Hambatan terhadap tindakan justru mendorong tindakan. Yang menghalangi jalan menjadi jalan itu sendiri. — Marcus Aurelius",

    // High-Impact Hadiths (Fokus: Produktivitas & Anti-Malas)
    "Dua kenikmatan yang banyak manusia tertipu di dalamnya: kesehatan dan waktu luang. — HR. Bukhari",
    "Manfaatkanlah lima perkara sebelum lima perkara: hidupmu sebelum matimu, sehatmu sebelum sakitmu, waktu luangmu sebelum sibukmu, mudamu sebelum tuamu, dan kayamu sebelum miskinmu. — HR. Al-Hakim",
    "Tanda baiknya Islam seseorang adalah meninggalkan hal yang tidak bermanfaat baginya. — HR. Tirmidzi",
    "Sesungguhnya Allah menyukai pekerjaan yang apabila dilakukan, ia melakukannya dengan itqan (profesional & sempurna). — HR. Thabrani",
    "Bekerjalah untuk duniamu seakan-akan kamu hidup selamanya, dan bekerjalah untuk akhiratmu seakan-akan kamu mati besok. — HR. Ibnu Asakir",
    "Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah. — HR. Muslim",
    "Ya Allah, aku berlindung kepada-Mu dari rasa sedih dan gelisah, rasa lemah dan MALAS. — HR. Bukhari",
    "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia. — HR. Ahmad",
    "Bersegeralah melakukan amal-amal shalih (sebelum datang rintangan). — HR. Muslim",
    "Ikatlah (unta)mu, lalu bertawakkallah. — HR. Tirmidzi",
    "Selesaikanlah urusanmu di pagi hari, karena di waktu pagi terdapat berkah dan keberhasilan. — HR. Thabrani",
    "Terkutuklah orang-orang yang menunda-nunda pekerjaan. — HR. Al-Hakim",
    "Tangan di atas lebih baik daripada tangan di bawah. — HR. Bukhari",
    "Sesungguhnya amal perbuatan itu tergantung pada niatnya. — HR. Bukhari & Muslim",
    "Jagalah Allah, niscaya Allah akan menjagamu. — HR. Tirmidzi",
    "Allah tidak melihat rupa dan hartamu, tapi melihat hati dan amal perbuatanmu. — HR. Muslim"
];

// Achievements
const achievements = [
    {
        id: 'first_blood',
        name: 'First Blood',
        desc: 'Complete your first task',
        icon: '🎯',
        condition: () => appData.stats.totalCompleted >= 1
    },
    {
        id: 'warrior_week',
        name: 'Warrior Week',
        desc: 'Complete 7 tasks in a week',
        icon: '⚔️',
        condition: () => appData.stats.totalCompleted >= 7
    },
    {
        id: 'disciplined_soul',
        name: 'Disciplined Soul',
        desc: 'Conscientiousness > 80%',
        icon: '🧘',
        condition: () => appData.bigFive.conscientiousness >= 80
    },
    {
        id: 'zen_master',
        name: 'Zen Master',
        desc: 'Neuroticism < 20%',
        icon: '☮️',
        condition: () => appData.bigFive.neuroticism <= 20
    },
    {
        id: 'century',
        name: 'Century',
        desc: 'Complete 100 tasks',
        icon: '💯',
        condition: () => appData.stats.totalCompleted >= 100
    },
    {
        id: 'streak_champion',
        name: 'Streak Champion',
        desc: '7 day streak',
        icon: '🔥',
        condition: () => appData.streak >= 7
    },
    {
        id: 'level_10',
        name: 'Veteran',
        desc: 'Reach level 10',
        icon: '⭐',
        condition: () => appData.level >= 10
    },
    {
        id: 'perfectionist',
        name: 'Perfectionist',
        desc: 'Complete all High priority tasks',
        icon: '✨',
        condition: () => appData.tasks.filter(t => t.priority === 'high' && !t.completed).length === 0 &&
            appData.tasks.filter(t => t.priority === 'high').length > 0
    }
];

// XP Shop Rewards
const shopRewards = [
    { id: 'mlbb', name: 'Main Mobile Legends (1 Match)', price: 150, icon: '🎮' },
    { id: 'anime', name: 'Nonton Anime/Film (1 Episode)', price: 200, icon: '📺' },
    { id: 'snack', name: 'Jajan/Snack Santai', price: 100, icon: '🍿' }
];
