export const rules = `
- You must generate a photo that is consistent with the user's photos.
- The photo must include the user's face.
- The photo must portray the user in a positive and flattering way.
- The photo must not misrepresent the user's appearance, i.e. don't make them look younger, older, thinner, broader etc.
- The photo should look realistic and natural, as if it was taken by a friend, not a professional photographer.
- The photo must be a plausible photograph, nothing impossible or unrealistic.`
.trim()

export const examples = [
  {
    "scene_description": "A dynamic action shot of a blonde female tactical operator seated on the skid of a helicopter mid-flight, holding an assault rifle with a calm, focused demeanor.",
    "subject": {
      "type": "Young woman (Tactical Operator)",
      "age": "Late 20s",
      "features": {
        "hair": "Long, blonde, windblown, tied in a low loose ponytail or braid sweeping over the shoulder",
        "expression": "Serious, focused, confident, stoic gaze looking straight ahead",
        "skin": "Sun-kissed tone, natural texture",
        "other": "Minimal makeup, pink nail polish on fingers holding the weapon"
      },
      "attire": "Grey sleeveless high-neck crop top/tank top, camouflage combat pants (MultiCam pattern) with knee pads, tan tactical combat boots, black tactical headset with boom mic",
      "pose_position": "Seated securely on the external skid/step of a helicopter, legs dangling but stable, hands gripping a rifle resting across her lap"
    },
    "objects_and_props": {
      "main": [
        "Assault rifle (AR-15/M4 style) with optic sight and suppressor",
        "Black tactical headset",
        "Helicopter exterior (skid, door frame)"
      ],
      "secondary": [
        "Another tactical operator partially visible in the background behind her (wearing helmet and sunglasses)"
      ]
    },
    "environment": {
      "setting": "Outdoor aerial setting, exterior of a helicopter in flight",
      "foreground_elements": ["Helicopter skid", "Subject's boots"],
      "background": "Bright sky, blurred horizon, partial view of helicopter fuselage and rotor blades",
      "atmosphere": "High-stakes action, sunny, windy, intense but controlled"
    },
    "lighting": {
      "style": "Bright natural sunlight",
      "key_light": {
        "type": "Direct sun",
        "direction": "Overhead/Frontal",
        "color": "Daylight white",
        "effects": ["Strong highlights on hair and skin", "Hard shadows under the helicopter frame"]
      },
      "shadows_contrast": "High contrast, sharp shadows casting definition on the tactical gear and clothing folds"
    },
    "photography_style": {
      "medium": "Digital photography (Action/Military Editorial)",
      "aesthetic": "Cinematic action movie, tactical realism, adventurous",
      "mood": "Empowered, tough, professional",
      "color_grading": "Natural with slightly desaturated greens/tans typical of military aesthetic"
    },
    "camera_and_lens": {
      "angle_view": "Low angle looking slightly up",
      "framing_composition": "Full body shot, centered subject",
      "depth_of_field": "Deep depth of field, keeping subject and helicopter sharp",
      "focal_length_feel": "Standard to wide (approx 35-50mm)",
      "bokeh_style": "N/A"
    },
    "render_quality": {
      "realism": "Photorealistic",
      "resolution": "High resolution",
      "details": "Texture of the camouflage fabric, scratches on the helicopter metal, strands of windblown hair"
    }
  },
  {
    "type": "image_generation_prompt",
    "style": "ultra-wide angle, aerial portrait, contemporary studio photography",
    "identity_preservation": {
      "use_reference_image": true,
      "strict_identity_lock": true,
      "alter_face": false,
      "notes": "Preserve 100% of the woman’s facial features, proportions, skin texture, and natural expression from the reference image."
    },
    "composition": {
      "camera_angle": "top-down aerial view (approximately 90 degrees above the subject)",
      "framing": "full-body framing with emphasis on head and upper torso",
      "negative_space": "large amount of negative space surrounding the subject",
      "perspective_effect": "dramatic isolation and graphic impact"
    },
    "subject": {
      "gender": "female",
      "pose": {
        "body_position": "standing or lying naturally beneath the camera",
        "head_direction": "looking straight up toward the camera",
        "expression": "engaging, slightly curious or inquisitive"
      },
      "appearance": {
        "hair": {
          "style": "natural hairstyle with visible texture and volume",
          "notes": "do not alter hair color or structure from reference"
        },
        "eyewear": "round, thick-framed stylish glasses",
        "wardrobe": {
          "outer_layer": "short-sleeve button-up shirt in deep dark brown, corduroy or textured fabric",
          "inner_layer": "light beige or off-white textured sweater or t-shirt worn underneath"
        },
        "skin": {
          "tone": "natural, realistic",
          "texture": "clearly visible, not over-smoothed"
        }
      }
    },
    "environment": {
      "background": {
        "type": "studio backdrop",
        "color": "soft gray gradient",
        "gradient_style": "darker at the edges, lighter at the center directly beneath the subject"
      },
      "setup": "minimalist, distraction-free"
    },
    "lighting": {
      "type": "soft, uniform overhead lighting",
      "direction": "from above",
      "effect": [
        "subtle shadows defining facial features and clothing folds",
        "even illumination with no harsh contrast"
      ]
    },
    "camera_settings": {
      "iso": "150–200",
      "aperture": "f/1.28",
      "shutter_speed": "1/200s",
      "resolution": "high-resolution, ultra-detailed"
    },
    "color_grading": {
      "palette": "neutral, modern tones",
      "contrast": "soft and balanced",
      "look": "clean, contemporary"
    },
    "mood": {
      "atmosphere": "minimalist, modern, contemplative",
      "focus": "strong subject isolation and visual clarity"
    },
    "output_goal": "Create a high-resolution, top-down aerial studio portrait of a woman against a soft gray gradient background, with dramatic perspective, minimalist composition, and complete preservation of her facial identity and natural appearance."
  },
  {
    "intent": "An attractive young Caucasian woman with long black hair streaming Stardew Valley in her soft pink gamer girl setup, turning to look back at the camera with a playful kawaii peace sign gesture.",
    "frame": {
      "aspect_ratio": "3:4",
      "creative_style": "Soft pink gamer girl aesthetic, cozy streaming vibe with feminine pastel charm and interactive playfulness.",
      "composition": "Webcam-style view centering on face and upper body, subject slightly turned toward camera, monitor and pink peripherals visible, peace sign gesture prominent.",
      "style_mode": "raw_photoreal"
    },
    "subject": {
      "identity": "An attractive young Caucasian woman in her early 20s with long black hair, embodying the soft pink gamer girl archetype with warm, playful energy.",
      "face": {
        "skin": "Smooth, fair skin with subtle natural freckles, soft glow and healthy warmth.",
        "eyes": "Bright hazel eyes with long lashes, playful sparkle and direct gaze toward camera with cute tilted head expression."
      },
      "hair": "Long, straight black hair reaching to the waist, silky and neatly falling over shoulders with a few strands framing the face.",
      "wardrobe": "Oversized cozy light gray hoodie with soft fabric drape and gentle tension across the torso implying sculptural volume and significant projection underneath, paired with comfortable black leggings showing natural contours.",
      "action": "Sitting in her pink Secretlab chair, wearing Razer Quartz pink cat-ear headset, one hand raised near face making a cute kawaii peace/V-sign with fingers, head slightly tilted and turned to look directly back at the camera with a sweet smile, other hand relaxed on desk near Razer Quartz pink keyboard, engaged in Stardew Valley gameplay."
    },
    "environment": {
      "location": "Cozy gaming bedroom with clean desk setup featuring pink Secretlab gaming chair, Razer Quartz pink keyboard and matching peripherals, monitor displaying cozy Stardew Valley farm scene, subtle hanging fairy/string lights draped around the room.",
      "weather": "Indoor, cozy conditions.",
      "time_of_day": "Evening (soft ambient glow from hanging lights)"
    },
    "lighting": {
      "subject_lighting": "Soft, flattering key light from desk ring light or softbox combined with warm glow from hanging lights, creating smooth gradients, beautiful skin rendering, and gentle catchlights in eyes.",
      "environment_lighting": "Subtle warm white hanging fairy/string lights providing gentle, diffused ambiance throughout the room, low-intensity pink accents from peripherals.",
      "color_temperature": "5000K",
      "contrast": "Low-medium contrast for cozy, inviting mood"
    },
    "camera": {
      "sensor_format": "High-quality webcam or mirrorless camera simulation (clean, sharp stream feed).",
      "lens": "35mm equivalent, f/1.8 for natural flattering perspective.",
      "camera_position": "Eye-level webcam POV atop monitor, straight-on capturing the subject turning slightly toward camera for direct playful engagement."
    },
    "post_processing": {
      "color_grading_lut": "Soft warm pink-tinted grade with gentle saturation on skin tones and pink elements, light vignette for focus.",
      "sharpening_level": "Moderate sharpening on eyes, hair details, facial features, and peace sign hand."
    },
    "negative": {
      "style": "No plastic skin, no harsh shadows, no overexposure, no digital artifacts, no heavy makeup.",
      "content": "Hands on chest, crossing arms, bra straps, short or wavy hair, cluttered desk, dark room elements, excessive cute props, additional people, distorted hand gestures."
    }
  },
  {
    "Objective": "Create an ultra-realistic cinematic close-up winter portrait with a moody urban atmosphere, balancing cool winter tones and warm city light.",
    "Persona_Details": {
      "Subject": "Young adult man",
      "Facial_Features": {
        "Facial_Hair": "Light stubble",
        "Expression": "Calm, thoughtful",
        "Gaze": "Looking slightly upward"
      },
      "Appearance_Interaction": {
        "Snow": "Soft snowflakes settling naturally on hair, scarf, and coat"
      }
    },
    "Wardrobe": {
      "Outerwear": "Dark winter overcoat",
      "Accessory": "Thick knitted scarf",
      "Style": "Classic, understated winter fashion"
    },
    "Scene_and_Environment": {
      "Location": "Outdoor winter city street at night",
      "Atmosphere": {
        "Snowfall": "Gentle, continuous snowfall",
        "Mood": "Quiet, reflective, cinematic"
      },
      "Background": {
        "Lighting": "Warm golden street lamps",
        "Effect": "Soft circular bokeh highlights"
      }
    },
    "Lighting_and_Mood": {
      "Key_Light": "Cool blue winter light illuminating the face",
      "Accent_Light": "Warm golden highlights from street lamps",
      "Contrast": "Cool-to-warm cinematic balance",
      "Mood": "Atmospheric, intimate, emotionally reflective"
    },
    "Photography_Style": {
      "Genre": "Cinematic urban portrait",
      "Lens": "85mm",
      "Aperture": "f/1.8",
      "Depth_of_Field": "Shallow depth of field",
      "Framing": "Close-up portrait",
      "Focus": "Eyes and facial details razor-sharp with smooth background blur"
    },
    "Color_and_Grading": {
      "Color_Grade": "Cinematic color grading",
      "Shadows": "Teal-blue winter tones",
      "Highlights": "Warm golden accents",
      "Overall_Palette": [
        "Cool blues",
        "Deep neutrals",
        "Warm amber highlights"
      ]
    },
    "Detail_and_Quality": {
      "Texture_Detail": [
        "Realistic skin texture",
        "Fine stubble detail",
        "Knitted fabric fibers",
        "Individual snowflakes"
      ],
      "Realism_Level": "Photorealistic",
      "Quality": "Professional photography standard"
    },
    "Quality_Tags": [
      "Ultra-realistic",
      "Photorealism",
      "Cinematic winter portrait",
      "Urban night atmosphere",
      "High-end editorial"
    ],
    "Negative_Prompts": [
      "Text",
      "Logo",
      "Watermark",
      "Over-smooth skin",
      "Cartoon or illustration style",
      "Flat lighting",
      "Low resolution"
    ],
    "Output_Constraints": {
      "Text_Overlay": false,
      "Branding": false,
      "Watermark": false
    },
    "Response_Format": {
      "Type": "Single image",
      "Aspect_Ratio": "Portrait (4:5 or 3:4 recommended)",
      "Use_Case": "Cinematic portraiture, winter editorial, lifestyle storytelling"
    }
  },
  {
    "scene": {
      "type": "portrait",
      "style": "hyperrealistic, soft-focus, cinematic lighting, 8K UHD",
      "composition": "tight-medium shot, centered framing, eye-level perspective"
    },
    "subjects": [
      {
        "type": "human",
        "gender": "female",
        "age": "young adult",
        "skin_tone": "fair, smooth, luminous with subtle peach undertones",
        "facial_features": {
          "eyes": {
            "shape": "almond",
            "color": "light blue-gray",
            "makeup": "minimal mascara, natural shimmer under-eye"
          },
          "eyebrows": {
            "color": "light brown",
            "thickness": "medium",
            "style": "natural, slightly bushy with defined arch"
          },
          "nose": "small, narrow bridge, softly contoured",
          "lips": {
            "shape": "full and softly rounded",
            "color": "natural peach nude",
            "finish": "matte"
          },
          "cheeks": "soft blush tone with visible freckles",
          "skin_texture": "silky, even, with visible light reflection on cheekbones",
          "makeup": "natural look with subtle warm tones and minimal highlight"
        },
        "hair": {
          "color": "light brown with warm honey undertones",
          "style": "curly updo, soft ringlets framing the face, wispy fringe",
          "texture": "fine, voluminous with defined curls"
        },
        "expression": "calm, serene gaze directly toward the camera",
        "pose": "head tilted slightly toward the rabbit, right hand gently holding the animal close to cheek"
      },
      {
        "type": "animal",
        "species": "rabbit",
        "fur_color": "light beige with white gradient on underside",
        "eye_color": "dark brown",
        "ear_shape": "upright, inner ear pale pink",
        "texture": "soft, plush, fine fur strands clearly visible",
        "pose": "held close to woman's face, facing forward with neutral calm expression",
        "lighting": "subtle highlights on fur, natural texture preserved"
      }
    ],
    "clothing_and_accessories": {
      "outfit": {
        "type": "gown",
        "color": "bright yellow",
        "material": "lace fabric with ruffled floral texture and soft shimmer",
        "design_details": "layered, translucent patterns with intricate embroidery",
        "sleeves": "off-shoulder puffy sleeves with heavy ruffles"
      },
      "jewelry": {
        "earrings": "small dangling gold earrings with a teardrop gemstone"
      }
    },
    "background": {
      "theme": "soft yellow floral backdrop",
      "texture": "blurred bokeh-style pattern of yellow flowers",
      "depth_of_field": "shallow, strong background blur maintaining focus on subjects",
      "color_palette": "warm golden yellow, beige, and soft cream tones"
    },
    "lighting": {
      "source": "soft natural or diffused studio light from front-left direction",
      "shadows": "minimal, soft gradient transitions",
      "highlights": "on cheekbones, upper lips, and rabbit fur edges",
      "mood": "dreamlike warmth and tenderness"
    },
    "color_grading": {
      "dominant_tones": "warm yellows, golden highlights, natural skin tones",
      "contrast": "medium-high contrast, soft luminance",
      "saturation": "balanced, slightly warm enhancement"
    },
    "quality": {
      "resolution": "8K ultra-HD",
      "sharpness": "extremely high on subject, micro-detail visible on skin pores and lace texture",
      "depth": "clear separation between subject and blurred background"
    },
    "mood_and_style": {
      "theme": "tenderness, innocence, harmony between human and nature",
      "art_direction": "fine art portrait photography with a romantic vintage aesthetic"
    }
  },
  {
    "image_type": "portrait_photography",
    "resolution_target": "8K UHD",
    "aspect_ratio": "vertical",
    "frame_composition": {
      "crop": "mid-chest to head",
      "orientation": "portrait",
      "subject_position": "centered",
      "camera_angle": "eye-level",
      "perspective": "straight-on"
    },
    "subject": {
      "gender_presentation": "female",
      "age_appearance": "young adult",
      "face": {
        "shape": "oval",
        "skin_tone": "fair with neutral undertone",
        "skin_texture": "smooth, natural, visible realism, no heavy retouching",
        "facial_features": {
          "eyes": {
            "color": "light blue-green",
            "shape": "almond-shaped",
            "gaze_direction": "directly toward camera",
            "eyelids": "slightly relaxed",
            "eyelashes": "natural length, not exaggerated"
          },
          "eyebrows": {
            "color": "dark brown",
            "thickness": "medium",
            "shape": "soft natural arch"
          },
          "nose": {
            "shape": "straight",
            "size": "proportionate",
            "bridge": "smooth"
          },
          "lips": {
            "color": "soft natural pink",
            "fullness": "medium to full",
            "state": "slightly parted"
          }
        },
        "expression": "neutral, calm, composed"
      },
      "hair": {
        "color": "dark brown",
        "length": "short to medium",
        "style": "loose, slightly wavy",
        "movement": "wind-blown strands crossing face",
        "parting": "natural, unstructured"
      }
    },
    "clothing": {
      "outerwear": {
        "type": "coat",
        "color": "deep royal blue",
        "material_appearance": "wool or felt-like texture",
        "fit": "structured but relaxed",
        "visible_details": "clean seams, minimal design"
      },
      "accessory": {
        "type": "scarf",
        "color": "matching royal blue",
        "material_appearance": "soft, fabric texture",
        "placement": "wrapped loosely around neck"
      }
    },
    "color_palette": {
      "dominant_colors": [
        "royal blue",
        "deep blue",
        "soft skin tones"
      ],
      "contrast": "high contrast between blue clothing and lighter skin",
      "color_temperature": "cool"
    },
    "lighting": {
      "type": "natural light",
      "direction": "frontal with slight side softness",
      "intensity": "moderate",
      "shadows": "soft, minimal harsh shadows",
      "highlights": "subtle highlights on cheekbones and lips"
    },
    "background": {
      "environment": "open outdoor setting",
      "elements": "blurred horizon line, blue gradient background",
      "depth_of_field": "shallow",
      "background_detail": "intentionally out of focus",
      "color": "blue gradient resembling sky and distant water"
    },
    "image_style": {
      "realism": "high realism with subtle AI polish",
      "sharpness": "high facial detail",
      "texture_detail": "visible fabric texture and skin detail",
      "noise": "minimal",
      "post_processing": "clean color grading, no heavy filters"
    },
    "mood": {
      "overall_feel": "calm, serene, minimalistic",
      "visual_energy": "soft and composed"
    },
    "generation_constraints": {
      "preserve_original_composition": true,
      "preserve_subject_structure": true,
      "no_face_alteration": true,
      "no_style_assumptions": true,
      "do_not_change_image_size": true
    }
  },
  {
    "Objective": "Create an ultra-realistic, cinematic portrait that conveys an intimate winter storytelling mood with warmth, softness, and photorealistic detail.",
    "Persona_Details": {
      "Subject": "Young adult woman",
      "Facial_Features": {
        "Eyes": "Striking blue eyes",
        "Skin": "Soft rosy skin tones with realistic texture",
        "Freckles": "Natural freckles across nose and cheeks",
        "Cheeks": "Subtle flushed cheeks from cold weather"
      },
      "Hair": {
        "Color": "Dark brown",
        "Style": "Loose strands framing the face",
        "Detail": "Single braid draped over one shoulder"
      },
      "Expression": "Gentle, calm expression with a hint of wonder"
    },
    "Wardrobe_and_Props": {
      "Clothing": {
        "Type": "Thick knitted wool sweater",
        "Color_Palette": "Earthy brown and grey tones"
      },
      "Prop": {
        "Item": "Small rustic gift",
        "Wrapping": "Brown paper tied with twine"
      }
    },
    "Scene_and_Environment": {
      "Location": "Cozy winter cabin interior",
      "Background": {
        "Elements": "Warm golden fairy lights",
        "Effect": "Soft bokeh highlights"
      }
    },
    "Lighting": {
      "Primary_Light": "Soft natural window light",
      "Secondary_Light": "Warm ambient interior lighting",
      "Mood": "Warm, intimate, cozy",
      "Shadows": "Soft and natural"
    },
    "Photography_Style": {
      "Genre": "Cinematic editorial portrait",
      "Lens": "85mm",
      "Aperture": "f/1.8",
      "Depth_of_Field": "Shallow depth of field",
      "Focus": "Sharp facial features with softly blurred background"
    },
    "Color_and_Grading": {
      "Grading": "Cinematic color grading",
      "Palette": "Warm, earthy, winter-inspired tones"
    },
    "Quality_Tags": [
      "Ultra-realistic",
      "Photorealism",
      "High detail skin texture",
      "Fine hair detail",
      "Intimate storytelling"
    ],
    "Negative_Prompts": [
      "Text",
      "Logo",
      "Watermark",
      "Plastic skin",
      "Overly smooth face",
      "Cartoon or illustration style"
    ],
    "Output_Constraints": {
      "Text_Overlay": false,
      "Branding": false,
      "Watermark": false
    },
    "Response_Format": {
      "Type": "Single image",
      "Aspect_Ratio": "Portrait (4:5 or 3:4 recommended)",
      "Use_Case": "Cinematic storytelling, lifestyle, winter editorial portrait"
    }
  },
  {
    "type": "image_generation_prompt",
    "style": "photorealistic, Mediterranean urban travel, cinematic daylight",
    "identity_preservation": {
      "use_reference_image": true,
      "alter_face": false,
      "strict_identity_lock": true
    },
    "subject": {
      "gender": "male",
      "pose": {
        "stance": "standing near a historic stone building",
        "posture": "relaxed, confident"
      }
    },
    "environment": {
      "location": "Barcelona, Spain",
      "background": {
        "architecture": "Gaudí-inspired buildings",
        "atmosphere": "vibrant city energy"
      }
    }
  },
  "A moody, candid-style photograph of a young woman, created using the provided photo reference as a strict and non-negotiable source. Preserve the exact facial structure, proportions, skin texture, and all distinctive facial details with 100% accuracy. No changes to facial features or identity. The subject is shown in profile, wearing dark over-ear headphones and a light-colored knit sweater, looking to the right. A strong, warm golden side light illuminates the face, sculpting the features and creating deep, cinematic shadows. The foreground is partially obscured by large, out-of-focus geometric shadow shapes that naturally frame the subject, adding depth and visual tension. A soft, warm light bokeh appears in the upper right corner. The background remains dark, minimal, and indistinct, ensuring full focus on the face. The overall atmosphere is intimate, contemplative, and cinematic, with a natural, unposed photographic feel. Ultra-realistic, true-to-life lighting, no digital art look, no CGI, authentic photography aesthetic.",
  "A medium close-up, seen through a slightly reflective window, of a young man use face impression from selected image with curly brown hair, wearing a dark t-shirt, engrossed in reading an open book. He is seated at a wooden counter or table in what appears to be a cafe or bar, with warm, out-of-focus lights (Edison bulbs) in the background creating a bokeh effect. A silver cup is visible next to the book. The overall mood is contemplative and cozy."
]