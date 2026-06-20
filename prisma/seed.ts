import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clean existing records
  await prisma.user.deleteMany({});
  await prisma.song.deleteMany({});

  // 2. Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@karaokehub.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@karaokehub.com',
      passwordHash,
      role: 'USER',
    },
  });

  console.log(`👤 Created Users:\n- Admin: ${admin.email}\n- Regular User: ${user.email}\n- Password for both: password123`);

  // 4. Create Songs with LRC Synchronized Lyrics
  const songsData = [
    {
      title: 'Tujhe Kitna Chahne Lage',
      artist: 'Arijit Singh',
      language: 'Hindi',
      audioUrl: 'http://localhost:5000/uploads/tujhe_kitna_chahne_lage.mp4',
      backgroundUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=800',
      lyrics: `[00:00.00](Instrumental Intro)
[00:05.00]Dil ka dariya beh hi gaya
[00:10.00]Ishq ibadat ban hi gaya
[00:15.00]Khud ko mujhe tu saunp de
[00:20.00]Meri zarurat tu ban gaya
[00:25.00]Baat dil ki nazron ne ki
[00:30.00]Sach keh raha teri kasam
[00:35.00]Tere bin ab na lenge ek bhi dam
[00:40.00]Tujhe kitna chahne lage hum
[00:46.00]Tere saath ho jayenge khatam
[00:52.00]Tujhe kitna chahne lage hum`
    },
    {
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh',
      language: 'Hindi',
      audioUrl: 'http://localhost:5000/uploads/tum_hi_ho.ogg',
      backgroundUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
      lyrics: `[00:00.00](Soft Piano Intro)
[00:06.00]Hum tere bin ab reh nahi sakte
[00:12.00]Tere bina kya wajood mera
[00:18.00]Tujhse juda agar ho jayenge
[00:24.00]Toh khud se hi ho jayenge juda
[00:30.00]Kyunki tum hi ho, ab tum hi ho
[00:36.00]Zindagi ab tum hi ho
[00:42.00]Chain bhi, mera dard bhi
[00:48.00]Meri aashiqui ab tum hi ho`
    },
    {
      title: 'Kabira',
      artist: 'Tochi Raina, Rekha Bhardwaj',
      language: 'Hindi',
      audioUrl: 'http://localhost:5000/uploads/kabira.mp3',
      backgroundUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800',
      lyrics: `[00:00.00](Acoustic Guitar Intro)
[00:06.00]Kaisi teri khudgarzi
[00:09.00]Na dhoop chune na chhaaon
[00:12.00]Kaisi teri khudgarzi
[00:15.00]Kisi thaur tike na paaon
[00:18.00]Ban ke titli dil uda hai
[00:21.00]Kahin door, door, door, door, door, door
[00:24.00]Re Kabira maan ja
[00:27.00]Aaja tujhko pukaarein teri parchaaiyan
[00:30.00]Re Kabira maan ja
[00:33.00]Kaisa tu hai nirmoya, kaisa harjaiya`
    },
    {
      title: 'Perfect',
      artist: 'Ed Sheeran',
      language: 'English',
      audioUrl: 'http://localhost:5000/uploads/perfect.mp3',
      backgroundUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800',
      lyrics: `[00:00.00](Guitar Chords Intro)
[00:04.00]I found a love for me
[00:09.00]Oh darling, just dive right in and follow my lead
[00:15.00]Well, I found a girl, beautiful and sweet
[00:21.00]Oh, I never knew you were the someone waiting for me
[00:27.00]'Cause we were just kids when we fell in love
[00:32.00]Not knowing what it was
[00:35.00]I will not give you up this time
[00:40.00]But darling, just kiss me slow
[00:43.00]Your heart is all I own
[00:46.00]And in your eyes, you're holding mine
[00:51.00]Baby, I'm dancing in the dark
[00:56.00]With you between my arms
[01:00.00]Barefoot on the grass
[01:03.00]Listening to our favourite song`
    },
    {
      title: 'Someone Like You',
      artist: 'Adele',
      language: 'English',
      audioUrl: 'http://localhost:5000/uploads/someone_like_you.mp3',
      backgroundUrl: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800',
      lyrics: `[00:00.00](Melancholy Piano Intro)
[00:05.00]I heard that you're settled down
[00:10.00]That you found a girl and you're married now
[00:15.00]I heard that your dreams came true
[00:20.00]Guess she gave you things, I didn't give to you
[00:25.00]Old friend, why are you so shy?
[00:30.00]Ain't like you to hold back or hide from the light
[00:36.00]I hate to turn up out of the blue, uninvited
[00:42.00]But I couldn't stay away, I couldn't fight it
[00:47.00]I had hoped you'd see my face
[00:50.00]And that you'd be reminded that for me, it isn't over
[00:56.00]Never mind, I'll find someone like you
[01:02.00]I wish nothing but the best for you, too
[01:07.00]Don't forget me, I beg
[01:10.00]I remember you said
[01:12.00]Sometimes it lasts in love, but sometimes it hurts instead`
    },
    {
      title: 'Stay',
      artist: 'The Kid LAROI & Justin Bieber',
      language: 'English',
      audioUrl: 'http://localhost:5000/uploads/stay.mp3',
      backgroundUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800',
      lyrics: `[00:00.00](Synth Intro)
[00:03.00]I do the same thing I told you that I never would
[00:06.00]I told you I'd change, even when I knew I never could
[00:09.00]I know that I can't find nobody else as good as you
[00:12.00]I need you to stay, need you to stay, yeah
[00:15.00]I get drunk, wake up, I'm wasted still
[00:18.00]I realize the time that I wasted here
[00:21.00]I feel like you can't feel the way I feel
[00:24.00]Oh, I'll be fucked up if you can't be right here
[00:27.00]Oh-oh-oh, oh-oh-oh-oh
[00:30.00]Oh-oh-oh, need you to stay`
    }
  ];

  for (const songData of songsData) {
    const song = await prisma.song.create({
      data: songData,
    });
    console.log(`🎵 Seeded Song: "${song.title}" by ${song.artist}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
