<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            // College of Education (CEd)
            ['code' => 'BEEd', 'name' => 'Bachelor of Elementary Education', 'college' => 'College of Education'],
            ['code' => 'BECEd', 'name' => 'Bachelor of Early Childhood Education', 'college' => 'College of Education'],
            ['code' => 'BSpNEd', 'name' => 'Bachelor of Special Needs Education', 'college' => 'College of Education'],
            ['code' => 'BSEd Math', 'name' => 'Bachelor of Secondary Education (Major in Mathematics)', 'college' => 'College of Education'],
            ['code' => 'BSEd Science', 'name' => 'Bachelor of Secondary Education (Major in Science)', 'college' => 'College of Education'],
            ['code' => 'BSEd English', 'name' => 'Bachelor of Secondary Education (Major in English)', 'college' => 'College of Education'],
            ['code' => 'BPEd', 'name' => 'Bachelor of Physical Education', 'college' => 'College of Education'],
            ['code' => 'BTLEd HE', 'name' => 'Bachelor of Technology and Livelihood Education (Home Economics)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd Auto', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Automotive Technology)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd CCT', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Civil Construction Technology)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd CSS', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Computer Systems Servicing)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd ET', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Electrical Technology)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd ELX', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Electronics Technology)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd Mech', 'name' => 'Bachelor of Technical-Vocational Teacher Education (Mechanical Technology)', 'college' => 'College of Education'],
            ['code' => 'BTVTEd HVAC', 'name' => 'Bachelor of Technical-Vocational Teacher Education (HVAC Technology)', 'college' => 'College of Education'],

            // School of Applied Economics (SAEc)
            ['code' => 'BSEcon', 'name' => 'Bachelor of Science in Economics', 'college' => 'School of Applied Economics'],

            // College of Business Administration (CBA)
            ['code' => 'BSBA FM', 'name' => 'Bachelor of Science in Business Administration (Financial Management)', 'college' => 'College of Business Administration'],
            ['code' => 'BSEntrep', 'name' => 'Bachelor of Science in Entrepreneurship', 'college' => 'College of Business Administration'],
            ['code' => 'BSHM', 'name' => 'Bachelor of Science in Hospitality Management', 'college' => 'College of Business Administration'],

            // College of Engineering (CoE)
            ['code' => 'BSCE', 'name' => 'Bachelor of Science in Civil Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BSECE', 'name' => 'Bachelor of Science in Electronics Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BSEE', 'name' => 'Bachelor of Science in Electrical Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BSME', 'name' => 'Bachelor of Science in Mechanical Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BSGE', 'name' => 'Bachelor of Science in Geodetic Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BS Geology', 'name' => 'Bachelor of Science in Geology', 'college' => 'College of Engineering'],
            ['code' => 'BS Mining Eng', 'name' => 'Bachelor of Science in Mining Engineering', 'college' => 'College of Engineering'],
            ['code' => 'BS Sanitary Eng', 'name' => 'Bachelor of Science in Sanitary Engineering', 'college' => 'College of Engineering'],

            // College of Arts and Sciences (CAS)
            ['code' => 'BS Math', 'name' => 'Bachelor of Science in Mathematics', 'college' => 'College of Arts and Sciences'],
            ['code' => 'BS Stat', 'name' => 'Bachelor of Science in Statistics', 'college' => 'College of Arts and Sciences'],
            ['code' => 'BA LCS', 'name' => 'Bachelor of Arts in Literature and Cultural Studies', 'college' => 'College of Arts and Sciences'],
            ['code' => 'BS Bio (Animal Biology)', 'name' => 'Bachelor of Science in Biology (Animal Biology)', 'college' => 'College of Arts and Sciences'],
            ['code' => 'BS Bio (Plant Biology)', 'name' => 'Bachelor of Science in Biology (Plant Biology)', 'college' => 'College of Arts and Sciences'],

            // College of Information and Computing (CIC)
            ['code' => 'BSIT', 'name' => 'Bachelor of Science in Information Technology', 'college' => 'College of Information and Computing'],
            ['code' => 'BSBTM', 'name' => 'Bachelor of Science in Business Technology Management', 'college' => 'College of Information and Computing'],
            ['code' => 'BSCS', 'name' => 'Bachelor of Science in Computer Science', 'college' => 'College of Information and Computing'],
            ['code' => 'BLIS', 'name' => 'Bachelor of Library and Information Science', 'college' => 'College of Information and Computing'],
        ];

        foreach ($courses as $course) {
            Course::firstOrCreate(
                ['name' => $course['name']], // Use name as unique identifier
                [
                    'code' => $course['code'],
                    'college' => $course['college'],
                    'is_active' => true,
                ]
            );
        }
    }
}
