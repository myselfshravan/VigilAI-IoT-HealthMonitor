import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MapComponent from "@/components/MapComponent";
import { Header } from "@/components/ui/header";
import { useMockData } from "@/components/MockDataProvider";

const Profile = () => {
  const { data } = useMockData();
  // Get the most recent coordinates from the mock data
  const latestData = data[data.length - 1];

  // Hardcoded user details with real-time location
  const user = {
    name: "Chiranth",
    phone: "9945332995",
    address: "#24 Jehovah Nissi, Mathikere Extenssion, Bangalore, 560054",
    coordinates: {
      latitude: latestData?.Lat ?? 13.0354, // Fallback to default if no data
      longitude: latestData?.Long ?? 77.5646,
    },
  };

  return (
    <div>
      <Header
        title="VigilAI - Health Monitoring System"
        subtitle="Real-time vital signs visualization"
      />
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="/placeholder.svg" alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.name}'s Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-1">
                <h3 className="font-semibold">Patient Name</h3>
                <p className="text-gray-600">{user.name}</p>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">Phone Number</h3>
                <p className="text-gray-600">{user.phone}</p>
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">Address</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {user.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Location & Geofencing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-1">
                  <h3 className="font-semibold">Real-time Location</h3>
                  <p className="text-gray-600">
                    Latitude: {user.coordinates.latitude.toFixed(6)}°N, Longitude:{" "}
                    {user.coordinates.longitude.toFixed(6)}°E
                  </p>
                </div>
                <MapComponent
                  latitude={user.coordinates.latitude}
                  longitude={user.coordinates.longitude}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
