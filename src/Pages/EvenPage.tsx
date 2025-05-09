import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { creatMagiccLink, getEventid, SendQr } from "@/lib/user.action";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadCloud, UserX2, Users, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx"; 

import TemplateEditor from '../components/TemplateEditor'

const EvenPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>();
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState("");
  const [comment, setComment] = useState("");
  const [magicLinks, setMagicLinks] = useState<
    { email: string; hours: string;}[]
  >([]);
  const [x,setX]=useState('');
  const [y,setY]=useState('');
  const [width,setWidth]=useState('');
  const [height,setHeight]=useState('');
  const [templateData,setTemplateData]=useState('');

const setQr=(data)=>{
    setX(data.x);
    setY(data.y);
    setHeight(data.height);
    setWidth(data.width);
    console.log(x);
    console.log(y);

    console.log(width);

    console.log(height);

}


  useEffect(() => {
    const get = async () => {
      const ev = await getEventid(id as string);
      setEvent(ev);
    };
    get();
  }, [id]);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddMagicLink = () => {
    if (!isValidEmail(email)) return alert("Invalid email");
    if (!hours || isNaN(Number(hours))) return alert("Hours must be a number");

    const newEntry = { email, hours, comment };
    setMagicLinks((prev) => [...prev, newEntry]);

    // Clear inputs
    setEmail("");
    setHours("");
    setComment("");
  };

  const handleRemove = (index: number) => {
    setMagicLinks((prev) => prev.filter((_, i) => i !== index));
  };
  const [excelData, setExcelData] = useState([]); // ← Add state to store Excel rows

  if (!event) return <div className="p-10">Loading...</div>;

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
  
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json(sheet);
  
      // Trim and lowercase keys
      const cleanedJson = rawJson.map((row: any) => {
        const trimmedRow: any = {};
        for (const key in row) {
          const normalizedKey = key.trim().toLowerCase(); // ← lowercased column names
          const value = row[key];
          trimmedRow[normalizedKey] =
            typeof value === "string" ? value.trim() : value;
        }
        return trimmedRow;
      });
  
      setExcelData(cleanedJson);
    };
    reader.readAsArrayBuffer(file);
  };
  
  
  const handleBulkUpload = async () => {
    if (excelData.length === 0) {
      alert("No Excel data to upload");
      return;
    }
  
    // Add eventId to each entry before sending
    const enrichedData = excelData.map((item: any) => ({
      ...item,
      eventId: id,
    }));
  
    try {
      const res=await SendQr(enrichedData,x,y,width,height,templateData);
  
      const data = res;
      if (res.ok) {
        alert("QR codes sent successfully");
        setExcelData([]); // Clear table if needed
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert("Failed to send QR codes");
    }
  };
   const handleCreateMagicLink=async()=>{
           console.log(magicLinks);
           const res= await creatMagiccLink(magicLinks,id);
           console.log(res);
   }
   const handelAdminRemove=async(admin)=>{
    console.log(admin);
    
   }
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attendance */}
          <div className="flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Attendance: {event.attendance}</span>
          </div>

          {/* Admins */}
          <div>
            <h4 className="font-semibold mb-1">Admins</h4>
            {event.admins.length > 0 ? (
              <div className="flex flex-wrap gap-2" >
                {event.admins.map((admin: string, i: number) => (
                  <Badge key={i} variant="secondary" 
                  onClick={()=>
                    handelAdminRemove(admin)}>
                    {admin}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 flex items-center gap-2 text-sm">
                <UserX2 className="w-4 h-4" /> No admins
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-1">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((cat: string, i: number) => (
                <Badge key={i} className="bg-blue-100 text-blue-700">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Upload Excel */}
          <div className="mt-4">
            <Label htmlFor="excel" className="font-medium mb-2 block">
              Upload Attendance Sheet
            </Label>
            <Input id="excel" type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} />
            <Button className="mt-2" variant="outline">
              <UploadCloud className="w-4 h-4 mr-2" /> Upload
            </Button>
          </div>

          {/* Add Magic Link Section */}
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold">Add Magic Link</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
              
              <Button onClick={handleAddMagicLink}>Add</Button>
            </div>

            {/* Badge list */}
            {magicLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3">
                {magicLinks.map((link, i) => (
                  <Badge
                    key={i}
                    className="flex items-center gap-2 bg-green-100 text-green-700"
                    onClick={() => handleRemove(i)}
                  >
                    {link.email} ({link.hours})
                    <X
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => handleRemove(i)}
                    />
                  </Badge>
                ))}

              </div>
            )}
              {magicLinks.length > 0&&<Button onClick={handleCreateMagicLink}>Create Links</Button>}

          </div>
        </CardContent>
      </Card>
      {/* templade fixing qr */}
<TemplateEditor setQr={setQr} setTemplateData={setTemplateData}/>

      {/* Preview Table from Excel */}
<Button  className="mt-4"  onClick={handleBulkUpload} >
  Send Qr codes
</Button>
{excelData.length > 0 && (
  <div className="mt-6">
    <h4 className="font-semibold mb-2">Preview Uploaded Users</h4>
    <div className="overflow-auto rounded border">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            {Object.keys(excelData[0]).map((key) => (
              <th key={key} className="px-4 py-2 font-semibold">
                {key.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {excelData.map((row, idx) => (
            <tr key={idx} className="border-t">
              {Object.values(row).map((val, i) => (
                <td key={i} className="px-4 py-2">
                  {val as string}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
    </div>
  );
};

export default EvenPage;
