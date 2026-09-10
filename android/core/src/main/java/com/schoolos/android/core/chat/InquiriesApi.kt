package com.schoolos.android.core.chat

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

@Serializable
data class ChatApiResponse<T>(
    @SerialName("success") val success: Boolean = true,
    @SerialName("data") val data: T? = null,
    @SerialName("error") val error: ChatApiErrorDetail? = null,
)

@Serializable
data class ChatApiErrorDetail(
    @SerialName("code") val code: String? = null,
    @SerialName("message") val message: String? = null,
)

@Serializable
data class InquiryThreadDto(
    @SerialName("id") val id: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("student_name") val studentName: String,
    @SerialName("student_class") val studentClass: String = "",
    @SerialName("teacher_id") val teacherId: String? = null,
    @SerialName("teacher_name") val teacherName: String = "Guru Pengampu",
    @SerialName("subject_name") val subjectName: String = "Umum",
    @SerialName("inquiry_type") val inquiryType: String = "MATERIAL",
    @SerialName("reference_title") val referenceTitle: String,
    @SerialName("reference_id") val referenceId: String? = null,
    @SerialName("status") val status: String = "WAITING_REPLY",
    @SerialName("last_message_content") val lastMessageContent: String? = null,
    @SerialName("last_message_at") val lastMessageAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("message_count") val messageCount: Long = 1,
)

@Serializable
data class InquiryMessageDto(
    @SerialName("id") val id: String,
    @SerialName("thread_id") val threadId: String,
    @SerialName("sender_id") val senderId: String,
    @SerialName("sender_name") val senderName: String,
    @SerialName("sender_role") val senderRole: String,
    @SerialName("content") val content: String,
    @SerialName("is_from_teacher") val isFromTeacher: Boolean = false,
    @SerialName("created_at") val createdAt: String? = null,
)

@Serializable
data class InquiryDetailDto(
    @SerialName("thread") val thread: InquiryThreadDto,
    @SerialName("messages") val messages: List<InquiryMessageDto> = emptyList(),
)

@Serializable
data class CreateInquiryRequestDto(
    @SerialName("student_id") val studentId: String? = null,
    @SerialName("student_name") val studentName: String? = null,
    @SerialName("student_class") val studentClass: String? = null,
    @SerialName("teacher_id") val teacherId: String? = null,
    @SerialName("teacher_name") val teacherName: String? = null,
    @SerialName("subject_name") val subjectName: String? = null,
    @SerialName("inquiry_type") val inquiryType: String,
    @SerialName("reference_title") val referenceTitle: String,
    @SerialName("reference_id") val referenceId: String? = null,
    @SerialName("initial_message") val initialMessage: String,
)

@Serializable
data class SendInquiryMessageRequestDto(
    @SerialName("sender_id") val senderId: String? = null,
    @SerialName("sender_name") val senderName: String? = null,
    @SerialName("sender_role") val senderRole: String,
    @SerialName("content") val content: String,
)

interface InquiriesApi {
    @GET("learning/inquiries")
    suspend fun listInquiries(
        @Query("status") status: String? = null,
        @Query("inquiry_type") inquiryType: String? = null,
        @Query("search") search: String? = null,
        @Query("student_id") studentId: String? = null,
        @Query("teacher_id") teacherId: String? = null,
        @Query("teacher_name") teacherName: String? = null,
    ): ChatApiResponse<List<InquiryThreadDto>>

    @GET("learning/inquiries/{id}")
    suspend fun getInquiryDetail(
        @Path("id") id: String,
    ): ChatApiResponse<InquiryDetailDto>

    @POST("learning/inquiries")
    suspend fun createInquiry(
        @Body request: CreateInquiryRequestDto,
    ): ChatApiResponse<InquiryThreadDto>

    @POST("learning/inquiries/{id}/messages")
    suspend fun sendMessage(
        @Path("id") threadId: String,
        @Body request: SendInquiryMessageRequestDto,
    ): ChatApiResponse<InquiryMessageDto>
}
