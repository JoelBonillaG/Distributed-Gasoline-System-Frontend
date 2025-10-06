import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/shadcn/card";
import { Badge } from "../ui/shadcn/badge";
import { Building2 } from "lucide-react";

export default function PatientStats({ totalPatients, totalCenters }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Pacientes totales</CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                    <div className="text-3xl font-semibold">{totalPatients}</div>
                    <Badge className="gap-1">
                        <Building2 className="size-3" />
                        Activos
                    </Badge>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                    Datos actuales
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Centros</CardTitle>
                </CardHeader>
                <CardContent>
                    {totalCenters} centros activos
                </CardContent>
            </Card>
        </div>
    );
}
