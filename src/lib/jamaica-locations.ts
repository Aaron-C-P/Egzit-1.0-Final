// Comprehensive Jamaica location database with coordinates
export interface JamaicaLocation {
  name: string;
  parish: string;
  lat: number;
  lon: number;
  type: 'city' | 'town' | 'village' | 'district' | 'landmark';
}

export const jamaicaLocations: JamaicaLocation[] = [
  // Major Cities
  { name: 'Kingston', parish: 'Kingston', lat: 17.9714, lon: -76.7920, type: 'city' },
  { name: 'Montego Bay', parish: 'St. James', lat: 18.4762, lon: -77.8939, type: 'city' },
  { name: 'Spanish Town', parish: 'St. Catherine', lat: 17.9961, lon: -76.9530, type: 'city' },
  { name: 'Portmore', parish: 'St. Catherine', lat: 17.9519, lon: -76.8798, type: 'city' },
  { name: 'Mandeville', parish: 'Manchester', lat: 18.0431, lon: -77.5074, type: 'city' },
  
  // Towns
  { name: 'May Pen', parish: 'Clarendon', lat: 17.9691, lon: -77.2462, type: 'town' },
  { name: 'Old Harbour', parish: 'St. Catherine', lat: 17.9419, lon: -77.1083, type: 'town' },
  { name: 'Savanna-la-Mar', parish: 'Westmoreland', lat: 18.2167, lon: -78.1333, type: 'town' },
  { name: 'Ocho Rios', parish: 'St. Ann', lat: 18.4075, lon: -77.1050, type: 'town' },
  { name: 'Negril', parish: 'Westmoreland', lat: 18.2681, lon: -78.3494, type: 'town' },
  { name: 'Falmouth', parish: 'Trelawny', lat: 18.4936, lon: -77.6561, type: 'town' },
  { name: 'Port Antonio', parish: 'Portland', lat: 18.1789, lon: -76.4508, type: 'town' },
  { name: 'Black River', parish: 'St. Elizabeth', lat: 18.0258, lon: -77.8486, type: 'town' },
  { name: 'Linstead', parish: 'St. Catherine', lat: 18.1333, lon: -77.0333, type: 'town' },
  { name: 'Half Way Tree', parish: 'St. Andrew', lat: 18.0108, lon: -76.7983, type: 'town' },
  { name: 'New Kingston', parish: 'St. Andrew', lat: 18.0060, lon: -76.7853, type: 'district' },
  { name: 'Constant Spring', parish: 'St. Andrew', lat: 18.0333, lon: -76.7833, type: 'town' },
  { name: 'Papine', parish: 'St. Andrew', lat: 18.0194, lon: -76.7439, type: 'town' },
  { name: 'Cross Roads', parish: 'St. Andrew', lat: 18.0028, lon: -76.7914, type: 'district' },
  { name: 'Liguanea', parish: 'St. Andrew', lat: 18.0150, lon: -76.7700, type: 'district' },
  
  // More Towns and Villages
  { name: 'Morant Bay', parish: 'St. Thomas', lat: 17.8817, lon: -76.4083, type: 'town' },
  { name: 'Port Maria', parish: 'St. Mary', lat: 18.3722, lon: -76.8911, type: 'town' },
  { name: "St. Ann's Bay", parish: 'St. Ann', lat: 18.4319, lon: -77.2028, type: 'town' },
  { name: "Brown's Town", parish: 'St. Ann', lat: 18.3967, lon: -77.2594, type: 'town' },
  { name: 'Lucea', parish: 'Hanover', lat: 18.4500, lon: -78.1667, type: 'town' },
  { name: 'Port Royal', parish: 'Kingston', lat: 17.9361, lon: -76.8417, type: 'town' },
  { name: 'Bull Bay', parish: 'St. Andrew', lat: 17.9347, lon: -76.6861, type: 'village' },
  { name: 'Gordon Town', parish: 'St. Andrew', lat: 18.0428, lon: -76.7281, type: 'village' },
  { name: 'Irish Town', parish: 'St. Andrew', lat: 18.0667, lon: -76.7167, type: 'village' },
  { name: 'Stony Hill', parish: 'St. Andrew', lat: 18.0500, lon: -76.7667, type: 'village' },
  
  // Clarendon Parish
  { name: 'Chapelton', parish: 'Clarendon', lat: 18.0500, lon: -77.2667, type: 'town' },
  { name: 'Lionel Town', parish: 'Clarendon', lat: 17.8917, lon: -77.2000, type: 'town' },
  { name: 'Frankfield', parish: 'Clarendon', lat: 18.0833, lon: -77.3000, type: 'village' },
  { name: 'Hayes', parish: 'Clarendon', lat: 17.8833, lon: -77.2500, type: 'village' },
  { name: 'Milk River', parish: 'Clarendon', lat: 17.8667, lon: -77.3000, type: 'village' },
  { name: 'Rocky Point', parish: 'Clarendon', lat: 17.8167, lon: -77.1500, type: 'village' },
  
  // Manchester Parish
  { name: 'Christiana', parish: 'Manchester', lat: 18.1833, lon: -77.4833, type: 'town' },
  { name: 'Porus', parish: 'Manchester', lat: 17.9833, lon: -77.4167, type: 'town' },
  { name: 'Williamsfield', parish: 'Manchester', lat: 18.0500, lon: -77.5333, type: 'village' },
  { name: 'Mile Gully', parish: 'Manchester', lat: 18.1500, lon: -77.5333, type: 'village' },
  { name: 'Grove Place', parish: 'Manchester', lat: 18.0667, lon: -77.5167, type: 'village' },
  
  // St. Elizabeth Parish
  { name: 'Santa Cruz', parish: 'St. Elizabeth', lat: 18.0667, lon: -77.8000, type: 'town' },
  { name: 'Junction', parish: 'St. Elizabeth', lat: 18.0000, lon: -77.7833, type: 'village' },
  { name: 'Treasure Beach', parish: 'St. Elizabeth', lat: 17.8833, lon: -77.7500, type: 'village' },
  { name: 'Malvern', parish: 'St. Elizabeth', lat: 18.0167, lon: -77.7667, type: 'village' },
  { name: 'Balaclava', parish: 'St. Elizabeth', lat: 18.1500, lon: -77.6333, type: 'village' },
  { name: 'Lacovia', parish: 'St. Elizabeth', lat: 18.0833, lon: -77.7667, type: 'village' },
  { name: 'Middle Quarters', parish: 'St. Elizabeth', lat: 18.0500, lon: -77.7833, type: 'village' },
  
  // Westmoreland Parish
  { name: 'Whitehouse', parish: 'Westmoreland', lat: 18.0500, lon: -77.9667, type: 'village' },
  { name: 'Little London', parish: 'Westmoreland', lat: 18.2500, lon: -78.2167, type: 'village' },
  { name: 'Petersfield', parish: 'Westmoreland', lat: 18.1833, lon: -78.0500, type: 'village' },
  { name: 'Bluefields', parish: 'Westmoreland', lat: 18.1667, lon: -78.0333, type: 'village' },
  { name: 'Frome', parish: 'Westmoreland', lat: 18.2333, lon: -78.0833, type: 'village' },
  { name: 'Grange Hill', parish: 'Westmoreland', lat: 18.2833, lon: -78.1333, type: 'village' },
  
  // St. James Parish
  { name: 'Anchovy', parish: 'St. James', lat: 18.4000, lon: -77.9333, type: 'village' },
  { name: 'Rose Hall', parish: 'St. James', lat: 18.5167, lon: -77.8333, type: 'village' },
  { name: 'Ironshore', parish: 'St. James', lat: 18.4833, lon: -77.8500, type: 'district' },
  { name: 'Reading', parish: 'St. James', lat: 18.4167, lon: -77.9167, type: 'village' },
  { name: 'Cambridge', parish: 'St. James', lat: 18.3333, lon: -77.9000, type: 'village' },
  { name: 'Adelphi', parish: 'St. James', lat: 18.3667, lon: -77.9500, type: 'village' },
  
  // Trelawny Parish
  { name: 'Duncans', parish: 'Trelawny', lat: 18.4667, lon: -77.5333, type: 'village' },
  { name: 'Albert Town', parish: 'Trelawny', lat: 18.2833, lon: -77.5333, type: 'village' },
  { name: "Clark's Town", parish: 'Trelawny', lat: 18.3500, lon: -77.5333, type: 'village' },
  { name: 'Wakefield', parish: 'Trelawny', lat: 18.3667, lon: -77.5833, type: 'village' },
  { name: 'Wait-a-Bit', parish: 'Trelawny', lat: 18.3167, lon: -77.5500, type: 'village' },
  { name: 'Rio Bueno', parish: 'Trelawny', lat: 18.4667, lon: -77.4500, type: 'village' },
  
  // St. Ann Parish
  { name: 'Discovery Bay', parish: 'St. Ann', lat: 18.4500, lon: -77.4000, type: 'town' },
  { name: 'Runaway Bay', parish: 'St. Ann', lat: 18.4583, lon: -77.3167, type: 'town' },
  { name: 'Claremont', parish: 'St. Ann', lat: 18.3167, lon: -77.1833, type: 'village' },
  { name: 'Alexandria', parish: 'St. Ann', lat: 18.3333, lon: -77.2833, type: 'village' },
  { name: 'Moneague', parish: 'St. Ann', lat: 18.2333, lon: -77.1000, type: 'village' },
  { name: 'Steer Town', parish: 'St. Ann', lat: 18.4167, lon: -77.2167, type: 'village' },
  
  // St. Mary Parish
  { name: 'Annotto Bay', parish: 'St. Mary', lat: 18.2708, lon: -76.7653, type: 'town' },
  { name: 'Oracabessa', parish: 'St. Mary', lat: 18.4014, lon: -76.9450, type: 'town' },
  { name: 'Highgate', parish: 'St. Mary', lat: 18.3000, lon: -76.8833, type: 'village' },
  { name: 'Gayle', parish: 'St. Mary', lat: 18.3500, lon: -76.9167, type: 'village' },
  { name: 'Castleton', parish: 'St. Mary', lat: 18.1500, lon: -76.8333, type: 'village' },
  { name: 'Richmond', parish: 'St. Mary', lat: 18.3167, lon: -76.8667, type: 'village' },
  
  // Portland Parish
  { name: 'Buff Bay', parish: 'Portland', lat: 18.2333, lon: -76.6500, type: 'town' },
  { name: 'Boston Bay', parish: 'Portland', lat: 18.1833, lon: -76.3667, type: 'village' },
  { name: 'Long Bay', parish: 'Portland', lat: 18.1167, lon: -76.3000, type: 'village' },
  { name: 'Hope Bay', parish: 'Portland', lat: 18.2000, lon: -76.5500, type: 'village' },
  { name: 'Manchioneal', parish: 'Portland', lat: 18.0333, lon: -76.2833, type: 'village' },
  { name: 'Fairy Hill', parish: 'Portland', lat: 18.1500, lon: -76.3833, type: 'village' },
  { name: 'San San', parish: 'Portland', lat: 18.1667, lon: -76.4000, type: 'village' },
  
  // St. Thomas Parish
  { name: 'Yallahs', parish: 'St. Thomas', lat: 17.8833, lon: -76.5500, type: 'town' },
  { name: 'Bath', parish: 'St. Thomas', lat: 17.9667, lon: -76.3667, type: 'village' },
  { name: 'Port Morant', parish: 'St. Thomas', lat: 17.8917, lon: -76.3333, type: 'town' },
  { name: 'Golden Grove', parish: 'St. Thomas', lat: 17.9500, lon: -76.3833, type: 'village' },
  { name: 'Seaforth', parish: 'St. Thomas', lat: 17.9333, lon: -76.3500, type: 'village' },
  { name: 'Lyssons', parish: 'St. Thomas', lat: 17.8667, lon: -76.4333, type: 'village' },
  
  // Hanover Parish
  { name: 'Green Island', parish: 'Hanover', lat: 18.3833, lon: -78.2833, type: 'village' },
  { name: 'Sandy Bay', parish: 'Hanover', lat: 18.4333, lon: -78.2167, type: 'village' },
  { name: 'Hopewell', parish: 'Hanover', lat: 18.4333, lon: -78.0833, type: 'village' },
  { name: 'Askenish', parish: 'Hanover', lat: 18.3667, lon: -78.1167, type: 'village' },
  
  // St. Catherine Additional
  { name: 'Bog Walk', parish: 'St. Catherine', lat: 18.1000, lon: -77.0000, type: 'town' },
  { name: 'Ewarton', parish: 'St. Catherine', lat: 18.1833, lon: -77.0833, type: 'village' },
  { name: 'Above Rocks', parish: 'St. Catherine', lat: 18.0833, lon: -76.9333, type: 'village' },
  { name: 'Gregory Park', parish: 'St. Catherine', lat: 17.9667, lon: -76.8833, type: 'district' },
  { name: 'Waterford', parish: 'St. Catherine', lat: 17.9833, lon: -76.8667, type: 'district' },
  { name: 'Central Village', parish: 'St. Catherine', lat: 17.9667, lon: -76.9167, type: 'district' },
  { name: 'Hellshire', parish: 'St. Catherine', lat: 17.9167, lon: -76.9000, type: 'district' },
  { name: 'Ferry', parish: 'St. Catherine', lat: 17.9333, lon: -76.8500, type: 'village' },
  
  // Kingston & St. Andrew Additional
  { name: 'Downtown Kingston', parish: 'Kingston', lat: 17.9742, lon: -76.7928, type: 'district' },
  { name: 'Mona', parish: 'St. Andrew', lat: 18.0167, lon: -76.7500, type: 'district' },
  { name: 'August Town', parish: 'St. Andrew', lat: 18.0167, lon: -76.7333, type: 'district' },
  { name: 'Barbican', parish: 'St. Andrew', lat: 18.0333, lon: -76.7667, type: 'district' },
  { name: 'Hope Pastures', parish: 'St. Andrew', lat: 18.0167, lon: -76.7667, type: 'district' },
  { name: 'Manor Park', parish: 'St. Andrew', lat: 18.0333, lon: -76.7833, type: 'district' },
  { name: 'Red Hills', parish: 'St. Andrew', lat: 18.0667, lon: -76.8000, type: 'village' },
  { name: 'Cherry Gardens', parish: 'St. Andrew', lat: 18.0167, lon: -76.8000, type: 'district' },
  { name: 'Vineyard Town', parish: 'Kingston', lat: 17.9833, lon: -76.7667, type: 'district' },
  { name: 'Rockfort', parish: 'Kingston', lat: 17.9667, lon: -76.7500, type: 'district' },
  { name: 'Harbour View', parish: 'St. Andrew', lat: 17.9500, lon: -76.7167, type: 'district' },
  { name: 'Mountain View', parish: 'Kingston', lat: 17.9833, lon: -76.7500, type: 'district' },
  { name: 'Trench Town', parish: 'Kingston', lat: 17.9833, lon: -76.8000, type: 'district' },
  { name: 'Jones Town', parish: 'Kingston', lat: 17.9833, lon: -76.7833, type: 'district' },
  { name: 'Duhaney Park', parish: 'St. Andrew', lat: 18.0167, lon: -76.8167, type: 'district' },
  { name: 'Havendale', parish: 'St. Andrew', lat: 18.0333, lon: -76.8167, type: 'district' },
  { name: 'Meadowbrook', parish: 'St. Andrew', lat: 18.0333, lon: -76.8000, type: 'district' },
  { name: 'Norbrook', parish: 'St. Andrew', lat: 18.0333, lon: -76.8000, type: 'district' },
  { name: 'Skyline', parish: 'St. Andrew', lat: 18.0500, lon: -76.7833, type: 'district' },
  { name: 'Jack\'s Hill', parish: 'St. Andrew', lat: 18.0500, lon: -76.7500, type: 'village' },
  
  // Landmarks
  { name: 'Norman Manley International Airport', parish: 'Kingston', lat: 17.9356, lon: -76.7875, type: 'landmark' },
  { name: 'Sangster International Airport', parish: 'St. James', lat: 18.5037, lon: -77.9133, type: 'landmark' },
  { name: 'University of the West Indies', parish: 'St. Andrew', lat: 18.0050, lon: -76.7500, type: 'landmark' },
  { name: 'Emancipation Park', parish: 'St. Andrew', lat: 18.0089, lon: -76.7831, type: 'landmark' },
  { name: 'Devon House', parish: 'St. Andrew', lat: 18.0111, lon: -76.7856, type: 'landmark' },
  { name: "Dunn's River Falls", parish: 'St. Ann', lat: 18.4139, lon: -77.1353, type: 'landmark' },
  { name: 'Bob Marley Museum', parish: 'St. Andrew', lat: 18.0142, lon: -76.7889, type: 'landmark' },
  { name: 'Blue Mountains', parish: 'St. Andrew', lat: 18.0500, lon: -76.6000, type: 'landmark' },
  { name: 'Appleton Estate', parish: 'St. Elizabeth', lat: 18.1667, lon: -77.7333, type: 'landmark' },
  { name: 'YS Falls', parish: 'St. Elizabeth', lat: 18.1583, lon: -77.7500, type: 'landmark' },
  { name: 'National Heroes Park', parish: 'Kingston', lat: 17.9889, lon: -76.7933, type: 'landmark' },
  { name: 'Hope Gardens', parish: 'St. Andrew', lat: 18.0139, lon: -76.7528, type: 'landmark' },
  { name: 'Blue Hole', parish: 'St. Ann', lat: 18.3833, lon: -77.1167, type: 'landmark' },
  { name: 'Mystic Mountain', parish: 'St. Ann', lat: 18.4167, lon: -77.1167, type: 'landmark' },
  { name: "Rick's Cafe", parish: 'Westmoreland', lat: 18.2667, lon: -78.3667, type: 'landmark' },
  { name: 'Seven Mile Beach', parish: 'Westmoreland', lat: 18.2833, lon: -78.3500, type: 'landmark' },
  { name: 'Doctor\'s Cave Beach', parish: 'St. James', lat: 18.4833, lon: -77.9167, type: 'landmark' },
  { name: 'Green Grotto Caves', parish: 'St. Ann', lat: 18.4333, lon: -77.3500, type: 'landmark' },
  { name: 'Rose Hall Great House', parish: 'St. James', lat: 18.5000, lon: -77.8500, type: 'landmark' },
  { name: 'Frenchman\'s Cove', parish: 'Portland', lat: 18.1833, lon: -76.4333, type: 'landmark' },
  { name: 'Blue Lagoon', parish: 'Portland', lat: 18.1833, lon: -76.4167, type: 'landmark' },
  { name: 'Reach Falls', parish: 'Portland', lat: 18.0167, lon: -76.3000, type: 'landmark' },
  { name: 'Port Henderson', parish: 'St. Catherine', lat: 17.9333, lon: -76.8667, type: 'landmark' },
  { name: 'Fort Charles', parish: 'Kingston', lat: 17.9367, lon: -76.8417, type: 'landmark' },
];

// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Estimate travel time based on distance (assuming average speed)
export function estimateTravelTime(distanceKm: number, vehicleType: 'car' | 'truck' = 'car'): number {
  // Average speeds in km/h accounting for Jamaica road conditions
  const avgSpeed = vehicleType === 'truck' ? 35 : 45;
  const timeHours = distanceKm / avgSpeed;
  return Math.round(timeHours * 60); // Return minutes
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// Format time for display
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Search locations by query
export function searchJamaicaLocations(query: string): JamaicaLocation[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return [];
  
  return jamaicaLocations
    .filter(loc => 
      loc.name.toLowerCase().includes(lowerQuery) ||
      loc.parish.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => {
      // Prioritize exact matches and city/town types
      const aStartsWith = a.name.toLowerCase().startsWith(lowerQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(lowerQuery);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      const typeOrder = { city: 0, town: 1, district: 2, landmark: 3, village: 4 };
      return typeOrder[a.type] - typeOrder[b.type];
    })
    .slice(0, 10);
}
