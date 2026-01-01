<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'hackathon_id',
        'submission_id',
        'team_id',
        'user_id',
        'winner_position',
        'certificate_template',
        'certificate_data',
        'certificate_number',
        'issued_date',
        'is_issued',
    ];

    protected $casts = [
        'certificate_data' => 'array',
        'issued_date' => 'date',
        'is_issued' => 'boolean',
        'winner_position' => 'integer',
    ];

    // Relationships
    public function hackathon()
    {
        return $this->belongsTo(Hackathon::class);
    }

    public function submission()
    {
        return $this->belongsTo(Submission::class);
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Generate unique certificate number
    public static function generateCertificateNumber($hackathonId, $position)
    {
        $prefix = 'CERT-' . strtoupper(substr(md5($hackathonId . $position . now()), 0, 8));
        $number = $prefix . '-' . now()->format('Ymd') . '-' . str_pad($position, 2, '0', STR_PAD_LEFT);
        
        // Ensure uniqueness
        $count = 1;
        while (self::where('certificate_number', $number)->exists()) {
            $number = $prefix . '-' . now()->format('Ymd') . '-' . str_pad($position, 2, '0', STR_PAD_LEFT) . '-' . $count;
            $count++;
        }
        
        return $number;
    }
}
