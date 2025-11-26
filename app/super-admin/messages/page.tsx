"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { superAdminApi } from "@/lib/api/super-admin";
import type { MessageWithRelations, SendMessageData } from "@/types/super-admin";
import {
  Plus,
  Send,
  Mail,
  MessageCircle,
  Phone,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const dynamic = "force-dynamic";

export default function SuperAdminMessagesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageWithRelations[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  
  // Send Message Modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [formData, setFormData] = useState<SendMessageData>({
    clinicId: "",
    subject: "",
    content: "",
    type: "in_app",
  });

  useEffect(() => {
    fetchMessages();
  }, [page, typeFilter, readFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const filters: any = {
        page,
        pageSize,
      };
      
      if (typeFilter !== "all") filters.type = typeFilter;
      if (readFilter !== "all") filters.isRead = readFilter === "read";
      
      const response = await superAdminApi.getMessages(filters);
      setMessages(response.messages);
      setUnreadCount(response.unreadCount);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!formData.clinicId || !formData.subject || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await superAdminApi.sendMessage(formData);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
      fetchMessages();
      setSendModalOpen(false);
      setFormData({
        clinicId: "",
        subject: "",
        content: "",
        type: "in_app",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await superAdminApi.markMessageAsRead(id);
      toast({
        title: "Success",
        description: "Message marked as read",
      });
      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark as read",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "sms":
        return <Phone className="h-4 w-4" />;
      case "all":
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">
              Communicate with clinic admins
            </p>
          </div>
          <Button onClick={() => setSendModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="all">All Channels</SelectItem>
                </SelectContent>
              </Select>

              <Select value={readFilter} onValueChange={(value) => {
                setReadFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center">
                Total: {total} messages ({unreadCount} unread)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Showing {messages.length} of {total} messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow
                          key={message.id}
                          className={!message.isRead ? "bg-muted/50" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(message.type)}
                              <span className="capitalize text-sm">{message.type.replace("_", "-")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {message.subject}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm text-muted-foreground truncate">
                              {message.content}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{message.clinic.name}</span>
                          </TableCell>
                          <TableCell>
                            {message.toUser ? (
                              <span className="text-sm">{message.toUser.fullName || message.toUser.email}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">All Admins</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(message.sentAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {message.isRead ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                Read
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-blue-50 text-blue-700">
                                Unread
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!message.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Send Message Modal */}
        <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to clinic admin(s) via multiple channels
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinicId">Clinic ID *</Label>
                <Input
                  id="clinicId"
                  value={formData.clinicId}
                  onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                  placeholder="Enter clinic ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Message subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your message..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Delivery Method *</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value: "in_app" | "email" | "sms" | "all") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in_app" id="in_app" />
                    <Label htmlFor="in_app" className="cursor-pointer">
                      In-App Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="cursor-pointer">
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms" className="cursor-pointer">
                      SMS
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">
                      All Channels (In-App + Email + SMS)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

